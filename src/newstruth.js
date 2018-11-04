/**
 * NewsTruth goals & end state:
 * 1. Scrape news articles by URL
 * 2. Parse out the author, source, and names in article who make statements
 * 3. Delta between list of politifact known names and those from article
 *  3.a. Report on reputation, truthiness, pants-on-fire
 *  3.b. TODO -- implement fuzzy name search 'could be' when there is not an exact match
 * 4. TODO: Query statements, promises, and updates for delta names / Politifact statement api
 */
const _ = require('lodash');
const compromise = require('compromise');
const { Politifact } = require('./politifact');
const Article = require('newspaperjs').Article;

class NewsTruth {
    constructor(config) {
        this.config = config || { debug: false }
    }
    /**
     * Names coming out of compromise have tendency to include spaces, period, and posessives
     * @param {string} nameStr first or last names, single string
     * @returns string without the garbage
     */
    static sanitizeName(nameStr) {
        let nm = _.trim(nameStr);
        nm = _.capitalize(nameStr);
        if (_.endsWith('\'s'), nm) {
            nm = _.trimEnd(nm, '\'s');
        }
        if (_.endsWith('.'), nm) {
            nm = _.trimEnd(nm, '.');
        }
        // console.log('sanitized name:', nm);
        return nm;
    }
    static reportReputation(person) {
        if (person) {
            const {
                first_name,
                last_name,
                true_count,
                half_true_count,
                barely_true_count,
                pants_count
            } = person;
            console.log(`\t${first_name} ${last_name}: Truth counts, true: ${true_count} half: ${half_true_count} barely: ${barely_true_count}`);
            if(pants_count > 0) {
                console.log(`\t\tWARNING: known lies: ${pants_count}`);
            }
        }        
    }
    /**
     * Report persons mentioned in article and reputation.
     * @param {Article} article The article object coming from newspaperjs
     */
    analyzeArticle(article) {
        const { text, author, title } = article;
        console.log('\n');
        console.log(`** Analysis of ${title} by [${author}]`);
        // names
        const people = compromise(text).people().data();
        const knownPersons = new Map();
        // Locate known actors mentioned in article
        Object.values(people).forEach((person) => {
            const first = NewsTruth.sanitizeName(person.firstName);
            const last = NewsTruth.sanitizeName(person.lastName);
            const found = this.politifactWrapper.findPerson(first, last);
            if (found) {
                knownPersons.set(`${first} ${last}`, found);
            }
        });
        // Handle author case
        if (author && author !== '') {
            const authorName = _.words(author);
            console.log('** Author known as', authorName);
            if (authorName.length === 2) {
                const foundAuthor = this.politifactWrapper.findPerson(authorName[0], authorName[1]);
                if (foundAuthor) {
                    console.log('\tAuthor Reputation score found');
                    NewsTruth.reportReputation(foundAuthor);
                } else {
                    console.log('\tAuthor score not known')
                }
            }
        } else {
            console.log('\tAuthor not known for article...');
        }

        console.log('** Known actors mentioned in article ', knownPersons.size);
        if (knownPersons.size > 0) {
            // TODO: run statements analysis on known subjects
            knownPersons.forEach((value) => NewsTruth.reportReputation(value));
        }
    }
    async init() {
        this.politifactWrapper = new Politifact();
        await this.politifactWrapper.loadData();
    }
    /**
     * Analyze the truthiness of any subjects who make statements in a news article
     * @param {string} article_url URL of any news article on the WWW
     */
    async analyze(article_url) {
        const article = await Article(article_url);
        this.analyzeArticle(article);
    }
}

module.exports = NewsTruth;