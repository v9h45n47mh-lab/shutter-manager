/* Serve the real locally vendored UI modules in browser fixtures. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const frontend=path.resolve(__dirname,'../custom_components/rollladenplaner/frontend');
async function serveFamilyUI(route){
 const pathname=new URL(route.request().url()).pathname,index=pathname.indexOf('/family-ui/');
 if(index<0)return false;
 const file=path.resolve(frontend,decodeURIComponent(pathname.slice(index+1)));
 if(!file.startsWith(frontend+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
  await route.fulfill({status:404,body:'UI module not found'});return true;
 }
 const contentType=file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/plain';
 await route.fulfill({contentType,body:fs.readFileSync(file)});return true;
}
async function loadCardIntoVm(context){
 const source=fs.readFileSync(path.join(frontend,'shutter-manager-card.js'),'utf8');
 const statement=source.match(/^import \{([^}]+)\} from '[^']+';\n/);
 if(!statement)throw new Error('The card must import its pinned UI module');
 const lock=JSON.parse(fs.readFileSync(path.join(frontend,'family-ui.lock.json'),'utf8'));
 const bundle=fs.readFileSync(path.join(frontend,lock.module));
 context.__uiKit=await import('data:text/javascript;base64,'+bundle.toString('base64'));
 const bindings=statement[1].replace(/(\w+) as (\w+)/g,'$1:$2');
 vm.runInContext(`const {${bindings}}=globalThis.__uiKit;\n`+source.slice(statement[0].length)+'\nglobalThis.Card=ShutterManagerCard;',context);
}
module.exports={serveFamilyUI,loadCardIntoVm,frontend};
