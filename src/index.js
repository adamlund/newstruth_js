const NewsTruth = require('./newstruth');
const ARTICLES = require('./articles_list.json');

/**
 * Modify implementation of getArticles() to change what articles are analyzed.
 * @returns array of strings representing URLs of articles
 */
const getArticles = () => {
    return ARTICLES.articles;
};

async function main() {
    const newsTruth = new NewsTruth();
    await newsTruth.init();
    const articles = getArticles();
    // feed newstruth each article url, and it prints known liars to stdout
    for(const i in articles) {
        await newsTruth.analyze(articles[i]);
    }
}

main();