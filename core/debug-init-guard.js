
// F9Debug stub — kontrol init'ten ÖNCE yapılmalı
// (F9Debug.init() çağrısından sonra typeof kontrolü hiçbir zaman false olmaz)
if (typeof F9Debug === 'undefined' || !F9Debug) {
  window.F9Debug = {
    log:()=>{}, err:()=>{}, warn:()=>{}, init:()=>{}, clear:()=>{},
    snapshot:()=>{}, filter:()=>{}, getLogs:()=>[], getErrors:()=>[],
    switchTab:()=>{}, analyticsMove:()=>{}, analyticsLevelStart:()=>{},
    analyticsLevelEnd:()=>{}, renderStats:()=>{}, renderDirector:()=>{},
    getAnalytics:()=>({}), dirLevelStart:()=>{}, dirMove:()=>{}, dirLevelEnd:()=>{},
  };
}
// window'a ata — onclick gibi inline handler'lardan erişilebilsin
window.F9Debug = F9Debug;
// Init: debug modu açıksa paneli oluşturur, kapalıysa no-op
F9Debug.init();

