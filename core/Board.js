class Board{
  constructor(rng){this.size=GRID;this.rng=rng;this.cells=Array.from({length:GRID},()=>Array(GRID).fill(null));}
  *neighborPositions(r,c){for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){const nr=r+dr,nc=c+dc;if(nr>=0&&nr<this.size&&nc>=0&&nc<this.size) yield [nr,nc];}}
  neighborValues(r,c){const vals=new Set();for(const [nr,nc] of this.neighborPositions(r,c)){const v=this.cells[nr][nc];if(v!==null) vals.add(v);}return vals;}
  pickValueAvoidingNeighbors(r,c){
    const forbidden=this.neighborValues(r,c);
    let candidates=VALUES.filter(v=>!forbidden.has(v));
    if(candidates.length===0) candidates=VALUES;
    const neighborVals=this.neighborValues(r,c);
    if(neighborVals.size>0){
      const weighted=candidates.map(v=>{
        const isNineFriendly=[...NINE_PARTNERS[v]].some(p=>neighborVals.has(p));
        return [v, isNineFriendly?NINE_FRIENDLY_WEIGHT:1.0];
      });
      const total=weighted.reduce((s,[,w])=>s+w,0);
      let pick=this.rng()*total, cum=0;
      for(const [v,w] of weighted){ cum+=w; if(pick<=cum) return v; }
      return weighted[weighted.length-1][0];
    }
    return rngChoice(this.rng,candidates);
  }
  fillInitial(){for(let r=0;r<this.size;r++) for(let c=0;c<this.size;c++) this.cells[r][c]=this.pickValueAvoidingNeighbors(r,c);}
  getCell(r,c){if(r==null||c==null||r<0||c<0||r>=this.size||c>=this.size)return null;return this.cells[r][c];}
  setCell(r,c,v){this.cells[r][c]=v;}
  findViolationCells(){
    const out=[];
    for(let r=0;r<this.size;r++) for(let c=0;c<this.size;c++){
      const v=this.cells[r][c]; if(v===null||v===9) continue;
      if(c+1<this.size&&this.cells[r][c+1]===v) out.push([r,c+1]);
      if(r+1<this.size&&this.cells[r+1][c]===v) out.push([r+1,c]);
    }
    return out;
  }
  resolveRemainingViolations(maxPasses=10){
    for(let pass=0;pass<maxPasses;pass++){
      const violations=this.findViolationCells();
      if(violations.length===0) return;
      for(const [r,c] of violations) this.cells[r][c]=this.pickValueAvoidingNeighbors(r,c);
    }
  }
}
