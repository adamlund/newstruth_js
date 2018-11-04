const axios = require('axios');
const fse = require('fs-extra');
const path = require('path');
const slog = require('single-line-log').stdout;

/** 
 * Download and cache data from politifact API to use for local queries and storage.
 * Politifact '/person' endpoint does not provide filter to query for known people.
 * 
 * Phase 1: use .json format, load it into server memory and array.find
 * Phase 2: use mongo db as local storage with ETL
 */

class PolitifactWrapper {
    constructor() {
        this.pf_api_base = 'https://www.politifact.com';
        this.db_file = path.resolve(__dirname, '../local_data/pf_people.json');
        this.peopleData = { people: []};
    }
    async loadData() {
        if (!fse.existsSync(this.db_file) || fse.statSync(this.db_file).size < 1e1) {
            await this.downloadFromPolitifact();
        }
        this.peopleData = JSON.parse(fse.readFileSync(this.db_file), 'utf8');
        console.log('Number of people known', this.peopleData.persons.length);
    }
    config() {
        return ({ api_base: this.pf_api_base, db_file: this.db_file });
    };
    findPerson(first_name, last_name) {
        const personsFound = this.peopleData.persons.find((person) => {
            if (person.first_name === first_name && person.last_name == last_name) {
                return person;
            }
        });
        if (personsFound && personsFound.length > 0) {
            console.log('FOUND', personsFound.length, 'matching', first_name, last_name);
        }
        return personsFound;
    }
    getPeople() {
        return this.peopleData.persons;
    }
    async downloadFromPolitifact () {
        console.log('*** Downloading Person Data from Politifact ***');
        let allData = [];

        // loop mutation
        let route = '/api/v/2/person/?offset=0&limit=20';
        let maxCount = 1;
        let counter = 0;

        while (counter < maxCount) {
            try {
                const response = await axios.get(`${this.pf_api_base}${route}`);
                if (response.status < 400) {
                    const {
                        next,
                        offset,
                        total_count,
                        limit
                    } = response.data.meta;
                    route = next;
                    // set maxCount to total_count / limit to give number of loops
                    if (offset === 0) {
                        maxCount = Math.ceil(total_count / limit);
                    }
                    if (limit !== 20) {
                        throw new Error(`limit changed to ${limit} in offset ${offset} counter ${counter}`);
                    }
                    const results = response.data.objects;
                    allData = allData.concat(results);
                    const percentDone = ((allData.length / total_count) * 100).toFixed(2);
                    slog(`Read ${percentDone}% or ${allData.length}/${total_count} records. Offset ${offset} counter ${counter}/${maxCount}`);
                    counter += 1;
                } else {
                    throw new Error(response.status);
                }
            } catch(err) {
                counter = maxCount;
                console.error('SERVICE READ ERROR', err);
            }
        }
        slog.clear();
        console.log('\n\t** Writing downloaded data to file:', this.db_file);
        fse.writeFileSync(this.db_file, '{"persons":');
        fse.appendFileSync(this.db_file, JSON.stringify(allData));
        fse.appendFileSync(this.db_file, '}');
    };
};

module.exports = {
    Politifact: PolitifactWrapper
};