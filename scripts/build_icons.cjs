/* Build native vector brand assets; development dependency: sharp. */
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
(async()=>{
 const dir=path.resolve(__dirname,'../custom_components/light_manager/brand');
 const svg=fs.readFileSync(path.join(dir,'bulb.svg'),'utf8');
 for(const [prefix,source] of [['',svg],['dark_',svg.replaceAll('#078bb5','#54c9ee').replaceAll('#ffd16a','#ffcf65')]]){
  for(const [suffix,size] of [['',256],['@2x',512]]){
   await sharp(Buffer.from(source)).resize(size,size).png({compressionLevel:9}).toFile(path.join(dir,prefix+'icon'+suffix+'.png'));
  }
 }
 console.log('Brand icons: 256px / 512px, light + dark.');
})().catch(e=>{console.error(e);process.exit(1)});
