const NewsTruth = require('./newstruth');

const articles = [
'https://www.cnn.com/2018/11/04/politics/georgia-voter-registration-hacking-attempt-investigation/index.html',
// 'https://www.nytimes.com/2018/11/03/magazine/FBI-charlottesville-white-nationalism-far-right.html',
// 'https://www.cnn.com/2018/11/02/opinions/nic-robertson-opinion-intl/index.html',
// 'https://www.chron.com/news/article/Voters-set-to-render-fresh-verdict-on-Trump-13360929.php',
];

async function main() {
    const newsTruth = new NewsTruth();
    await newsTruth.init();
    // feed newstruth each article url, and it prints known liars to stdout
    for(const i in articles) {
        await newsTruth.analyze(articles[i]);
    }
}

main();