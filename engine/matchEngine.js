// [Oturum 15 — rules/ katmanı ayrıştırması] Şekil sabitleri
// rules/matchRules.js'e taşındı — bu dosyada sadece eşleşme
// BULMA mantığı (Sh fabrikası + findAllMatches ailesi) kalıyor.

function Sh(name,group,cells,spawn){return {name,group,cells,spawn};}
function cellKey(r,c){return r+","+c;}
function allNine(board,cells){
  for(const [r,c] of cells){
    if(r<0||r>=GRID||c<0||c>=GRID) return false;
    if(board.getCell(r,c)!==9) return false;
  }
  return true;
}
function translate(cells,dr,dc){return cells.map(([r,c])=>[r+dr,c+dc]);}

function findLineMatches(board,template,group,name,spawnOffsets,lastMovePos){
  const matches=[];
  const maxDr=Math.max(...template.map(p=>p[0])), maxDc=Math.max(...template.map(p=>p[1]));
  for(let baseR=0;baseR<=GRID-1-maxDr;baseR++){
    for(let baseC=0;baseC<=GRID-1-maxDc;baseC++){
      const cells=translate(template,baseR,baseC);
      if(!allNine(board,cells)) continue;
      let spawn=null;
      if(lastMovePos){
        const idx=cells.findIndex(([r,c])=>r===lastMovePos[0]&&c===lastMovePos[1]);
        if(idx!==-1&&spawnOffsets.includes(idx)) spawn=lastMovePos;
      }
      if(!spawn) spawn=cells[spawnOffsets[0]];
      matches.push({cells,group,shapeName:name,spawn,length:cells.length});
    }
  }
  return matches;
}
function findAllMatches(board,lastMovePos){
  const matches=[];
  for(const shape of ALL_FIXED_SHAPES){
    const maxDr=Math.max(...shape.cells.map(p=>p[0])), maxDc=Math.max(...shape.cells.map(p=>p[1]));
    for(let baseR=0;baseR<=GRID-1-maxDr;baseR++){
      for(let baseC=0;baseC<=GRID-1-maxDc;baseC++){
        const cells=translate(shape.cells,baseR,baseC);
        if(allNine(board,cells)){
          const spawn=[shape.spawn[0]+baseR,shape.spawn[1]+baseC];
          matches.push({cells,group:shape.group,shapeName:shape.name,spawn,length:cells.length});
        }
      }
    }
  }
  matches.push(...findLineMatches(board,LINE_3_H,GROUP_A,"line3_h",LINE_3_SPAWN_OFFSETS,lastMovePos));
  matches.push(...findLineMatches(board,LINE_3_V,GROUP_A,"line3_v",LINE_3_SPAWN_OFFSETS,lastMovePos));
  matches.push(...findLineMatches(board,LINE_4_H,GROUP_B,"line4_h",LINE_4_SPAWN_OFFSETS,lastMovePos));
  matches.push(...findLineMatches(board,LINE_4_V,GROUP_B,"line4_v",LINE_4_SPAWN_OFFSETS,lastMovePos));
  matches.push(...findLineMatches(board,LINE_5_H,GROUP_C,"line5_h",[LINE_5_SPAWN_OFFSET],lastMovePos));
  matches.push(...findLineMatches(board,LINE_5_V,GROUP_C,"line5_v",[LINE_5_SPAWN_OFFSET],lastMovePos));
  return matches;
}

function digitalRoot(n){ if(n<=0) return null; while(n>9){ n=String(n).split("").reduce((s,d)=>s+Number(d),0); } return n; }
function producesNineWith(value){
  const partners=new Set();
  for(let other=1;other<=8;other++){
    if(other===value) continue;
    const cands=[value+other, value*other];
    if(value>other) cands.push(value-other);
    else if(other>value) cands.push(other-value);
    if(other!==0 && value%other===0) cands.push(Math.floor(value/other));
    if(value!==0 && other%value===0) cands.push(Math.floor(other/value));
    if(cands.some(c=>c>0 && digitalRoot(c)===9)) partners.add(other);
  }
  return partners;
}
const NINE_PARTNERS={};
for(let v=1;v<=8;v++) NINE_PARTNERS[v]=producesNineWith(v);
const NINE_FRIENDLY_WEIGHT=3.0;


