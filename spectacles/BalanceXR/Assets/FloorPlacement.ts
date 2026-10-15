/** Geometry-only placement gate; Lens API calls live in BalanceLab. Units are cm. */
export type Point = {x:number; y:number; z:number}
export class FloorPlacement {
  generation = 0
  scanning = false
  candidate: Point | null = null
  lastHit = -Infinity
  begin(): number {
    this.generation++
    this.scanning=true
    this.candidate=null
    this.lastHit=-Infinity
    return this.generation
  }
  accept(generation:number, point:Point|null, normal:Point|null, eye:Point, now:number):boolean {
    if(!this.scanning||generation!==this.generation)return false
    this.candidate=null
    if(!point||!normal||![point.x,point.y,point.z,normal.x,normal.y,normal.z].every(Number.isFinite))return false
    const length=Math.sqrt(normal.x**2+normal.y**2+normal.z**2)
    const distance=Math.sqrt((point.x-eye.x)**2+(point.y-eye.y)**2+(point.z-eye.z)**2)
    // The user aims at the floor: reject walls, ceilings, close tabletops and far-away hits.
    if(length<.001||normal.y/length<.9||eye.y-point.y<70||distance>450)return false
    this.candidate={x:point.x,y:point.y,z:point.z}
    this.lastHit=now
    return true
  }
  ready(now:number):boolean {return this.scanning&&this.candidate!==null&&now-this.lastHit<=.5}
  confirm(now:number):Point|null {
    if(!this.ready(now))return null
    const point=this.candidate
    this.scanning=false
    this.generation++
    return point
  }
}
