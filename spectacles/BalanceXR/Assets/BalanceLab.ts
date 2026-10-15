import {HandInputData} from "SpectaclesInteractionKit.lspkg/Providers/HandInputData/HandInputData"
import {BalanceModel, Example, clamp} from "./BalanceModel"
import {FloorPlacement} from "./FloorPlacement"

type FactorControl = {kind: "rows" | "cols"; index: number; factor: number; axis: "x" | "z"; start: vec3; length: number; thumb: SceneObject; label: Text}
type Target = {obj: SceneObject; radius: number; action: () => void; slider?: FactorControl}
type Tile = {pivot: SceneObject; material: Material; prediction: SceneObject; truth: SceneObject}

@component
export class BalanceLab extends BaseScriptComponent {
  @input baseMaterial: Material
  @input camera: Camera
  private labelFont: Font = requireAsset("./BalanceFont.ttf") as Font
  private model = new BalanceModel()
  private root: SceneObject
  private frame: SceneObject
  private cube: RenderMesh
  private tiles: Tile[] = []
  private targets: Target[] = []
  private factors: FactorControl[] = []
  private exhibitScale = 1.5
  private status: Text
  private detail: Text
  private exampleLabel: Text
  private optimizeLabel: Text
  private tangible = false
  private modeLabel: Text
  private title: Text
  private errorGauge: SceneObject
  private errorThumb: SceneObject
  private errorThumbMaterial: Material
  private errorLabel: Text
  private selected = 12
  private hands: ReturnType<HandInputData["getHand"]>[] = []
  private down = [false, false]
  private drag: {hand: number; control: FactorControl; start: number; value: number} | null = null
  private optimizing = false
  private steps = 0
  private nextStep = 0
  private colors = true
  private cursor: SceneObject[] = []
  private ink: Material
  private blue: Material
  private yellow: Material
  private white: Material
  private cyan: Material
  private activeSliderMaterial: Material
  private buttonMaterial: Material
  private sliderMaterial: Material
  private placement = new FloorPlacement()
  private surfaceSession: HitTestSession | null = null
  private placementHint: Text
  private footprint: SceneObject
  private nextSurfaceQuery = 0
  private querySequence = 0
  private pendingSurfaceUntil = 0
  private destroyed = false

  onAwake(): void {
    this.createEvent("OnStartEvent").bind(() => this.start())
  }
  private node(name: string, parent?: SceneObject): SceneObject {
    const obj = global.scene.createSceneObject(name)
    obj.setParent(parent || this.root)
    return obj
  }
  private material(r: number, g: number, b: number): Material {
    const mat = this.baseMaterial.clone()
    mat.mainPass.baseColor = new vec4(r,g,b,1)
    return mat
  }
  private box(name: string, parent: SceneObject, pos: vec3, size: vec3, material: Material): SceneObject {
    const obj = this.node(name,parent)
    const mesh = obj.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    mesh.mesh = this.cube; mesh.mainMaterial = material
    obj.getTransform().setLocalPosition(pos)
    obj.getTransform().setLocalScale(size)
    return obj
  }
  private label(text: string, parent: SceneObject, pos: vec3, size = 1.2): Text {
    const obj = this.node(text,parent)
    obj.getTransform().setLocalPosition(pos)
    const txt = obj.createComponent("Component.Text") as Text
    txt.text = text; txt.font = this.labelFont; txt.size = 48
    const width=Math.max(25,text.length*size*.65)
    txt.worldSpaceRect=Rect.create(-width/2,width/2,-size,size)
    txt.horizontalAlignment = HorizontalAlignment.Center
    txt.verticalAlignment = VerticalAlignment.Center
    txt.textFill.color = new vec4(1,1,1,1)
    txt.twoSided = true
    txt.sizeToFit = true
    txt.horizontalOverflow = HorizontalOverflow.Overflow
    txt.verticalOverflow = VerticalOverflow.Overflow
    txt.depthTest = true
    return txt
  }
  private buildCube(): RenderMesh {
    const builder = new MeshBuilder([{name:"position",components:3},{name:"normal",components:3},{name:"texture0",components:2}])
    builder.topology = MeshTopology.Triangles
    builder.indexType = MeshIndexType.UInt16
    const faces = [
      [[0,0,1],[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]],
      [[0,0,-1],[.5,-.5,-.5],[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5]],
      [[0,1,0],[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5],[-.5,.5,-.5]],
      [[0,-1,0],[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5]],
      [[1,0,0],[.5,-.5,.5],[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5]],
      [[-1,0,0],[-.5,-.5,-.5],[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5]]]
    faces.forEach((f,i) => {
      for(let j=1;j<=4;j++) builder.appendVerticesInterleaved([...f[j],...f[0],j===2||j===3?1:0,j>=3?1:0])
      builder.appendIndices([i*4,i*4+1,i*4+2,i*4,i*4+2,i*4+3])
    })
    builder.updateMesh(); return builder.getMesh()
  }
  private surfaceLabel(text: string, pos: vec3, size = 1.05): Text {
    const txt = this.label(text,this.root,pos,size)
    txt.getTransform().setLocalRotation(quat.angleAxis(-Math.PI/2,vec3.right()))
    return txt
  }
  private button(text: string, x: number, z: number, width: number, action: () => void): Text {
    const obj=this.box(text,this.root,new vec3(x,7,z),new vec3(width,.65,3.5),this.buttonMaterial)
    this.targets.push({obj,radius:2.5,action})
    const label=this.surfaceLabel(text,new vec3(x,8,z),1.25)
    label.worldSpaceRect=Rect.create(-(width-1)/2,(width-1)/2,-1,1)
    label.depthTest=false
    label.renderOrder=20
    return label
  }
  private addFactor(kind: "rows" | "cols", index: number, factor: number): void {
    const row=kind==="rows", center=(index-2)*6.6
    const axis: "x" | "z"=row?"x":"z"
    // Independent rails stay in world space while the matrix tilts above them.
    const start=row?new vec3(-39,8,center+(factor===0?-1.45:1.45))
      :new vec3(center+(factor===0?-1.45:1.45),8,25)
    const length=14, midpoint=row?new vec3(start.x+length/2,start.y,start.z)
      :new vec3(start.x,start.y,start.z+length/2)
    this.box("Factor rail",this.root,midpoint,row?new vec3(length,.25,.25):new vec3(.25,.25,length),this.white)
    const thumb=this.box((row?"Person ":"Movie ")+(index+1)+" F"+(factor+1),this.root,start,new vec3(1.7,1.2,1.7),this.sliderMaterial)
    const pos=row?new vec3(-43.5,8.7,start.z):new vec3(start.x,8.7,43.5)
    const label=this.surfaceLabel("",pos,.78)
    const control:FactorControl={kind,index,factor,axis,start,length,thumb,label}
    this.factors.push(control)
    this.targets.push({obj:thumb,radius:1.55,slider:control,action:()=>{}})
  }
  private start(): void {
    this.cube = this.buildCube()
    this.root = global.scene.createSceneObject("Balance exhibit")
    this.ink = this.material(.035,.08,.13)
    this.blue = this.material(.06,.42,1)
    this.yellow = this.material(1,.73,.08)
    this.white = this.material(.65,.75,.82)
    this.cyan = this.material(.04,1,.85)
    this.sliderMaterial = this.material(.78,.82,.86)
    this.activeSliderMaterial = this.material(1,.24,.015)
    this.buttonMaterial = this.material(.25,.34,.42)
    this.root.getTransform().setLocalScale(new vec3(this.exhibitScale,this.exhibitScale,this.exhibitScale))
    this.frame = this.node("RMSE platform hinge")
    this.frame.getTransform().setLocalPosition(new vec3(0,20,0))
    // A stationary cradle gives the shared tilt a clear visual reference from every side.
    for(const x of [-18.5,18.5]) this.box("Fixed support",this.root,new vec3(x,10,0),new vec3(.65,20,1),this.ink)
    this.box("Fixed axle",this.root,new vec3(0,20,0),new vec3(39,.45,.45),this.white)
    for(const x of [-19,19]) this.box("Level reference",this.root,new vec3(x,0,0),new vec3(.4,.4,38),this.ink)
    for(const z of [-19,19]) this.box("Level reference",this.root,new vec3(0,0,z),new vec3(38,.4,.4),this.ink)
    for(const x of [-17.5,17.5]) this.box("Platform side",this.frame,new vec3(x,0,0),new vec3(.45,.6,35),this.white)
    for(const z of [-17.5,17.5]) this.box("Platform end",this.frame,new vec3(0,0,z),new vec3(35,.6,.45),this.white)
    for(let i=0;i<25;i++) {
      const pivot = this.node("Tile "+(Math.floor(i/5)+1)+":"+(i%5+1),this.frame)
      pivot.getTransform().setLocalPosition(new vec3((i%5-2)*6.6,0,(Math.floor(i/5)-2)*6.6))
      const mat = this.material(.4,.6,.4)
      const tile = this.box("Error tile",pivot,new vec3(0,0,0),new vec3(5.8,.3,5.8),mat)
      this.box("Independent hinge",pivot,new vec3(0,-.25,0),new vec3(6.3,.3,.3),this.white)
      const truth = this.box("Ground truth",pivot,new vec3(-1.25,.3,0),new vec3(1.4,.18,1),this.blue)
      const prediction = this.box("Prediction",pivot,new vec3(1.25,.3,0),new vec3(1.4,.18,1),this.yellow)
      this.tiles.push({pivot,material:mat,truth,prediction})
      this.targets.push({obj:tile,radius:3,action:()=>{this.selected=i;this.refresh()}})
    }
    this.title=this.label("MADFACT / BALANCE",this.root,new vec3(0,39,-10),2.1)
    this.status = this.label("",this.root,new vec3(0,35,-10),1.4)
    this.label("BLUE: truth    YELLOW: prediction",this.root,new vec3(0,32,-10),1)
    this.label("Pinch near a tile to inspect",this.root,new vec3(0,29,-10),.95)
    for(let j=0;j<5;j++) {
      for(let f=0;f<2;f++) {this.addFactor("rows",j,f);this.addFactor("cols",j,f)}
      this.surfaceLabel("Person "+(j+1),new vec3(-32,8.7,(j-2)*6.6-3),.85)
      this.surfaceLabel("Movie "+(j+1),new vec3((j-2)*6.6,8.7,47),.85)
    }
    this.optimizeLabel=this.button("Optimize",-13,54,10,()=>{this.optimizing=!this.optimizing;this.steps=0;this.nextStep=0;this.refresh()})
    this.button("Reset",0,54,8,()=>{this.optimizing=false;this.model.reset();this.refresh()})
    this.button("Reposition",13,54,11,()=>this.place())
    this.exampleLabel=this.button("Mixed errors",-10,60,15,()=>{
      const examples:Example[]=["mixed","small","maximum","balanced"]
      this.optimizing=false;this.model.reset(examples[(examples.indexOf(this.model.example)+1)%4]);this.refresh()
    })
    this.button("Colors",10,60,11,()=>{this.colors=!this.colors;this.refresh()})
    this.modeLabel=this.button("Show Tangible",0,66,18,()=>{
      this.tangible=!this.tangible
      this.refresh()
    })
    this.buildErrorGauge()
    this.detail=this.surfaceLabel("",new vec3(0,8,20),.95)
    this.surfaceLabel("Pinch any row or column factor handle and slide",new vec3(0,7,72),.95)
    this.surfaceLabel("F1 / F2     Walk around to inspect the balance",new vec3(0,7,75),.8)
    const input=HandInputData.getInstance()
    this.hands=[input.getHand("left"),input.getHand("right")]
    this.hands.forEach((_,i)=>this.cursor.push(this.box("Hand cursor",this.root,vec3.zero(),new vec3(.7,.7,.7),this.cyan)))
    this.buildPlacementUI()
    this.refresh();this.place()
    this.createEvent("UpdateEvent").bind(()=>this.update())
    this.createEvent("TouchStartEvent").bind((event:TouchStartEvent)=>this.tap(event.getTouchPosition()))
    this.createEvent("OnDestroyEvent").bind(()=>{
      this.destroyed=true;this.querySequence++
      if(this.surfaceSession)this.surfaceSession.stop()
      if(this.footprint)this.footprint.destroy()
      if(this.placementHint)this.placementHint.getSceneObject().destroy()
      if(this.root)this.root.destroy()
    })
    print("BalanceLab ready: 25 tiles, 20 inline factor sliders; floor placement preview, then world-fixed suspended exhibit. RMSE "+this.model.rmse().toFixed(4))
  }
  private buildErrorGauge():void {
    this.errorGauge=this.node("Cumulative error slider")
    for(let i=0;i<24;i++){
      const t=i/23
      this.box("Green to red error range",this.errorGauge,new vec3(-15+(i+.5)*30/24,8,50),new vec3(30/24+.02,.35,1.2),this.material(t,.95*(1-t)+.08*t,.05))
    }
    this.errorThumbMaterial=this.material(1,1,1)
    this.errorThumb=this.box("Cumulative error marker",this.errorGauge,new vec3(0,8.8,50),new vec3(.7,1.3,2),this.errorThumbMaterial)
    this.errorLabel=this.surfaceLabel("Total absolute error",new vec3(0,8.5,48),1)
    this.errorLabel.getSceneObject().setParent(this.errorGauge)
    const ends=this.surfaceLabel("0                                      100",new vec3(0,8.5,52),.85)
    ends.getSceneObject().setParent(this.errorGauge)
  }
  private updateBars(blend:number):void {
    this.tiles.forEach((tile,i)=>{
      for(const entry of [{obj:tile.truth,value:this.model.truths[i],x:-1.25},{obj:tile.prediction,value:this.model.prediction(i),x:1.25}]){
        const length=entry.value/5*4.4
        const height=entry.value*2.4
        const size=this.tangible?new vec3(1.4,height,1.4):new vec3(1.4,.18,length)
        const position=this.tangible?new vec3(entry.x,.2+height/2,0):new vec3(entry.x,.28,2.2-length/2)
        const tr=entry.obj.getTransform()
        tr.setLocalScale(vec3.lerp(tr.getLocalScale(),size,blend))
        tr.setLocalPosition(vec3.lerp(tr.getLocalPosition(),position,blend))
      }
    })
  }
  private buildPlacementUI():void {
    // This one prompt follows the view; the exhibit and footprint remain in world space.
    this.placementHint=this.label("Look at clear floor space",this.camera.getSceneObject(),new vec3(0,-7,-45),1.15)
    this.placementHint.depthTest=false
    this.footprint=global.scene.createSceneObject("Placement footprint")
    for(const x of [-70,31])this.box("Footprint side",this.footprint,new vec3(x,.6,32),new vec3(.7,.35,180),this.cyan)
    for(const z of [-58,122])this.box("Footprint end",this.footprint,new vec3(-19.5,.6,z),new vec3(101,.35,.7),this.cyan)
    try {
      const worldQuery=require("LensStudio:WorldQueryModule") as WorldQueryModule
      const options=HitTestSessionOptions.create()
      options.filter=true
      this.surfaceSession=worldQuery.createHitTestSessionWithOptions(options)
    } catch(error) {
      print("BalanceLab floor placement unavailable: "+error)
    }
  }
  private place(): void {
    this.setDrag(null);this.optimizing=false
    this.placement.begin();this.querySequence++
    this.nextSurfaceQuery=0;this.pendingSurfaceUntil=0
    this.root.enabled=false;this.footprint.enabled=false
    this.placementHint.getSceneObject().enabled=true
    this.placementHint.text=this.surfaceSession?"Look at clear floor space\nMove your view to choose a spot":"Floor detection unavailable. Test on Spectacles."
    this.down=this.hands.map(hand=>hand.isTracked()&&hand.isPinching())
    if(this.surfaceSession){this.surfaceSession.reset();this.surfaceSession.start()}
  }
  private updatePlacement():void {
    const now=getTime()
    if(this.surfaceSession&&now>=this.nextSurfaceQuery&&now>=this.pendingSurfaceUntil){
      this.nextSurfaceQuery=now+.2;this.pendingSurfaceUntil=now+1
      const generation=this.placement.generation, sequence=++this.querySequence
      const eye=this.camera.getTransform().getWorldPosition()
      const rayStart=this.camera.screenSpaceToWorldSpace(new vec2(.5,.5),1)
      const rayEnd=this.camera.screenSpaceToWorldSpace(new vec2(.5,.5),500)
      this.surfaceSession.hitTest(rayStart,rayEnd,(hit:WorldQueryHitTestResult)=>{
        if(this.destroyed||sequence!==this.querySequence||!this.placement.scanning||generation!==this.placement.generation)return
        this.pendingSurfaceUntil=0
        const ok=this.placement.accept(generation,hit?hit.position:null,hit?hit.normal:null,eye,getTime())
        if(ok&&this.placement.candidate){
          const p=this.placement.candidate, forward=this.camera.getTransform().forward
          const horizontal=new vec3(-forward.x,0,-forward.z)
          const flat=horizontal.length>.001?horizontal.normalize():new vec3(0,0,-1)
          const rotation=quat.lookAt(flat.uniformScale(-1),vec3.up())
          // Keep the balance suspended above the chosen floor point for walk-around viewing.
          this.root.getTransform().setWorldPosition(new vec3(p.x,p.y+65,p.z))
          this.root.getTransform().setWorldRotation(rotation)
          this.footprint.getTransform().setWorldPosition(new vec3(p.x,p.y,p.z))
          this.footprint.getTransform().setWorldRotation(rotation)
        }
      })
    }
    const ready=this.placement.ready(now)
    this.root.enabled=ready;this.footprint.enabled=ready
    if(this.surfaceSession)this.placementHint.text=ready?"Pinch to pin here\nThe exhibit will stay suspended above this spot":"Look at clear floor space\nMove your view slowly to find a spot"
    for(let i=0;i<this.hands.length;i++){
      const hand=this.hands[i], pinching=hand.isTracked()&&hand.isPinching()
      if(pinching&&!this.down[i]&&this.placement.confirm(now)){
        this.root.enabled=true;this.footprint.enabled=false
        this.placementHint.getSceneObject().enabled=false
        if(this.surfaceSession)this.surfaceSession.stop()
        // Consume the placement pinch; it must not also grab a slider.
        this.down=this.hands.map(h=>h.isTracked()&&h.isPinching())
        this.refresh()
        print("BalanceLab pinned above selected floor point; walk around the exhibit.")
        return
      }
      this.down[i]=pinching
    }
  }
  private refresh():void {
    const m=this.model
    this.title.text=this.tangible?"MADFACT / TANGIBLE":"MADFACT / BALANCE"
    this.modeLabel.text=this.tangible?"Show Balance":"Show Tangible"
    this.status.text="RMSE "+m.rmse().toFixed(2)+" / 4"+(this.tangible?"    |    Vertical towers":"    |    Platform "+m.frameDegrees().toFixed(1)+" deg")
    this.errorGauge.enabled=this.tangible
    const total=m.truths.reduce((sum,_,i)=>sum+Math.abs(m.error(i)),0), fraction=clamp(total/100)
    this.errorThumb.getTransform().setLocalPosition(new vec3(-15+fraction*30,8.8,50))
    this.errorThumbMaterial.mainPass.baseColor=new vec4(fraction,.95*(1-fraction)+.08*fraction,.05,1)
    this.errorLabel.text="Total absolute error: "+total.toFixed(2)+" / 100"
    this.optimizeLabel.text=this.optimizing?"Pause":"Optimize"
    this.exampleLabel.text={mixed:"Mixed errors",small:"Small errors",maximum:"Very large error",balanced:"Perfect balance"}[m.example]
    this.factors.forEach(control=>{
      const value=m[control.kind][control.index][control.factor]
      const p=new vec3(control.start.x,control.start.y,control.start.z)
      if(control.axis==="x")p.x+=control.length*value
      else p.z+=control.length*value
      control.thumb.getTransform().setLocalPosition(p)
      control.label.text="F"+(control.factor+1)+" "+value.toFixed(2)
    })
    const i=this.selected, error=m.error(i)
    this.detail.text="Cell "+(Math.floor(i/5)+1)+":"+(i%5+1)+"   Truth "+m.truths[i].toFixed(2)+"   Prediction "+m.prediction(i).toFixed(2)+"\nError "+(error>=0?"+":"")+error.toFixed(2)+"   |   Tile "+m.tileDegrees(i).toFixed(1)+" deg"
    this.tiles.forEach((tile,i)=>{
      const t=clamp(Math.abs(m.error(i))/4), selected=i===this.selected
      const color=this.colors?new vec4(.08+.92*t,.95-.78*t,.18-.12*t,1):new vec4(.5,.56,.63,1)
      tile.material.mainPass.baseColor=selected?new vec4(.1,.9,.85,1):color

    })
  }
  private setDrag(drag: {hand: number; control: FactorControl; start: number; value: number} | null):void {
    if(this.drag)(this.drag.control.thumb.getComponent("Component.RenderMeshVisual") as RenderMeshVisual).mainMaterial=this.sliderMaterial
    this.drag=drag
    if(drag)(drag.control.thumb.getComponent("Component.RenderMeshVisual") as RenderMeshVisual).mainMaterial=this.activeSliderMaterial
  }
  private nearest(world:vec3):Target|null {
    let result:Target|null=null, distance=Infinity
    this.targets.forEach(target=>{
      const d=world.distance(target.obj.getTransform().getWorldPosition())
      if(d<target.radius*this.exhibitScale&&d<distance){result=target;distance=d}
    })
    return result
  }
  private update():void {
    if(this.placement.scanning){
      this.cursor.forEach(obj=>obj.enabled=false)
      this.updatePlacement()
      return
    }
    const a=1-Math.exp(-getDeltaTime()*8)
    const rotate=(obj:SceneObject,degrees:number)=>{
      const transform=obj.getTransform()
      transform.setLocalRotation(quat.slerp(transform.getLocalRotation(),quat.angleAxis(degrees*Math.PI/180,vec3.right()),a))
    }
    rotate(this.frame,this.tangible?0:this.model.frameDegrees())
    this.tiles.forEach((tile,i)=>rotate(tile.pivot,this.tangible?0:this.model.tileDegrees(i)))
    this.updateBars(a)
    if(this.optimizing&&getTime()>=this.nextStep) {
      this.model.optimizeStep()
      this.steps++;this.nextStep=getTime()+.65
      if(this.steps>=40)this.optimizing=false
      this.refresh()
    }
    this.hands.forEach((hand,i)=>{
      if(this.placement.scanning)return
      const tracked=hand.isTracked()
      this.cursor[i].enabled=tracked
      if(!tracked){this.down[i]=false;if(this.drag?.hand===i)this.setDrag(null);return}
      const point=hand.indexTip.position
      this.cursor[i].getTransform().setWorldPosition(point)
      const pinching=hand.isPinching()
      if(pinching&&!this.down[i]&&!this.drag) {
        const target=this.nearest(point)
        if(target?.slider!==undefined){
          const control=target.slider
          const local=this.root.getTransform().getInvertedWorldTransform().multiplyPoint(point)
          this.setDrag({hand:i,control,start:local[control.axis],value:this.model[control.kind][control.index][control.factor]})
          this.optimizing=false
        }
        else if(target)target.action()
      }
      if(this.drag?.hand===i) {
        if(!pinching)this.setDrag(null)
        else {
          const local=this.root.getTransform().getInvertedWorldTransform().multiplyPoint(point)
          const d=this.drag, c=d.control
          this.model.setFactor(c.kind,c.index,c.factor,d.value+(local[c.axis]-d.start)/c.length)
          this.refresh()
        }
      }
      this.down[i]=pinching
    })
  }
  private tap(point:vec2):void {
    if(this.placement.scanning){
      if(this.placement.confirm(getTime())){
        this.root.enabled=true;this.footprint.enabled=false
        this.placementHint.getSceneObject().enabled=false
        if(this.surfaceSession)this.surfaceSession.stop()
      }
      return
    }
    // Desktop preview uses a screen ray against the same controls as direct pinch.
    const origin=this.camera.screenSpaceToWorldSpace(point,1)
    const dir=this.camera.screenSpaceToWorldSpace(point,200).sub(origin).normalize()
    let best:Target|null=null, distance=Infinity
    this.targets.forEach(t=>{
      const delta=t.obj.getTransform().getWorldPosition().sub(origin), along=delta.dot(dir)
      const miss=delta.sub(dir.uniformScale(along)).length
      if(along>0&&miss<t.radius*this.exhibitScale&&along<distance){best=t;distance=along}
    })
    if(best) {
      const target=best as Target
      if(target.slider!==undefined){
        this.optimizing=false
        const c=target.slider
        this.model.setFactor(c.kind,c.index,c.factor,(this.model[c.kind][c.index][c.factor]+.1)%1.01)
        this.refresh()
      }
      else target.action()
    }
  }
}
