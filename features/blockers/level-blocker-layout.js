class LevelBlockerLayout{
  constructor(placements){this.placements=placements;}
  applyTo(blockersMap){for(const [r,c,type] of this.placements) blockersMap.set(cellKey(r,c),{blockerType:type});}
  get length(){return this.placements.length;}
}
