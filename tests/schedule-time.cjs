/* Weekday labels follow Home Assistant's timezone, including midnight and DST. */
const assert=require('node:assert/strict'),vm=require('node:vm');
const context=vm.createContext({HTMLElement:class {},customElements:{get:()=>null,define(){}},window:{}});
(async()=>{
 await require('./frontend.cjs').loadCardIntoVm(context);
 const card=new context.Card();card.data={time_zone:'Europe/Berlin'};card._hass={config:{time_zone:'America/Los_Angeles'}};
 for(const [language,days] of [['de',['Mo','Di','Mi','Do','Fr','Sa','So']],['en',['Mon','Tue','Wed','Thu','Fri','Sat','Sun']]]){
  card.language=()=>language;
  for(let day=0;day<7;day++){
   const at=new Date(Date.UTC(2026,10,8+day,23,30));
   assert.equal(card.scheduleTime(at.toISOString()),days[day]+' 00:30','weekday and time use the HA date, not the browser or UTC date');
  }
 }
 card.language=()=> 'de';
 assert.equal(card.scheduleTime('2026-03-29T00:30:00Z'),'So 01:30');
 assert.equal(card.scheduleTime('2026-03-29T01:30:00Z'),'So 03:30');
 assert.equal(card.scheduleTime('2026-10-25T00:30:00Z'),'So 02:30');
 assert.equal(card.scheduleTime('2026-10-25T01:30:00Z'),'So 02:30');
 card.data.time_zone='Pacific/Kiritimati';
 assert.equal(card.scheduleTime('2026-11-13T12:30:00Z'),'Sa 02:30');
 delete card.data.time_zone;
 assert.equal(card.scheduleTime('2026-11-13T23:30:00Z'),'Fr 15:30','HA configuration is used when an older snapshot omits its timezone');
 assert.equal(card.scheduleTime('invalid'),'—');
 console.log('PASS: all seven weekdays in DE/EN, HA timezone precedence and fallback, UTC date boundaries, both DST transitions and invalid times.');
})().catch(error=>{console.error(error);process.exitCode=1;});
