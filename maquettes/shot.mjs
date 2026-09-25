import {createRequire} from 'module'; const require=createRequire(import.meta.url);
const {chromium}=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:1180,height:820},deviceScaleFactor:1.5});
for(const n of ['D','A','B','C']){await p.goto('file://'+process.cwd()+'/'+n+'.html');await p.waitForTimeout(700);await p.screenshot({path:n+'.png'});}
await b.close();
