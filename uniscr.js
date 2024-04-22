const cheerio = require("cheerio");
const axios = require("axios");
const https = require('https');

const fs = require('fs');

const MainList = [];

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

const fetchData = async (url) => {
    const result = await axios.get(url, {
        httpsAgent: new https.Agent({ rejectUnauthorized: false }) // This is for bypassing SSL certificate error
    });
    return result;
};

async function getUniversities() {
    const uniID = [];
    const result = await fetchData("https://yokatlas.yok.gov.tr/lisans-anasayfa.php");
    const $ = cheerio.load(result.data);

    const selectElement = $('#univ');
    const optgroups = selectElement.find('optgroup');
    
    optgroups.each((index, element) => {
        const optgroup = $(element);
        const universitiesInGroup = optgroup.find('option');
        universitiesInGroup.each((index, element) => {
            const university = $(element);
            uniID.push(university.val());
        });
    });

    return uniID;
}

const uniIDs = getUniversities();

async function getUniPrograms(uniID) {
    try {
        const result = await fetchData(`https://yokatlas.yok.gov.tr/lisans-univ.php?u=${uniID}`);
        const $ = cheerio.load(result.data);
        const pureData = $('.panel-title');
        const programs = [];
    
        const uni = $('h3');
        const uniName = uni.text().trim().split("'")[0];
    
        $('.panel-title').each((index, element) => {
            const divElement = $(element).find('div');
            const program = divElement.text().trim();

            if(!program.includes('M.T.O.K.') && !program.includes('KKTC'))
                programs.push(program);
        });
    
        // uniInfo[uniName] = programs;
        let uniInfo = {
            name: uniName,
            programs: programs
        }
    
        MainList.push(uniInfo);
        
    } catch (error) {
        console.log('Hata:', error);
    }
    return MainList;
}

function doIt() {
    uniIDs.then((res) => {
        res.forEach((uniID) => {

            console.log(uniID + ' ID\'li üniversitenin programları çekiliyor...');

            getUniPrograms(uniID).then((res) => {

                const jsonData = JSON.stringify(res, null, 2);
                fs.writeFile('./unis.json', jsonData, 'utf8', (err) => {
                    if (err) {
                        console.error('Dosya yazma hatası:', err);
                        return;
                    }
                    console.log(uniID + ' ID\'li uni JSON verisi başarıyla dosyaya kaydedildi.');
                });

            });
        });
    });
}

fs.readFile('./unis.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Dosya okuma hatası:', err);
        return;
    }
    data = JSON.parse(data);
    let i = 0;
    data.forEach(element => {
        i++;
        console.log(i + '. ' + element.name);
    });
});

// doIt(); //Just do it when u want to get the data again. It takes a lot of time.