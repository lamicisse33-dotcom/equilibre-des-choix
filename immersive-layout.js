/** Cadrage de la scène d'origine : seules la caméra et les marges changent. */
export function screenLayout(width,height) {
  const short=height<500,portrait=width/height<.85;
  return {width,height,aspect:width/height,portrait,short,
    top:short?.20:height<680?.20:.16,bottom:short?.53:height<680?.58:.62,
    fov:short?35:45,left:.04,right:.96};
}
function projection(x,y,z,lookY,dist,aspect,fov,approach=1){
  const r=dist/7.74*approach,cy=lookY+4.2*r,cz=2.4+6.5*r;
  const n=Math.hypot(4.2,6.5),fy=-4.2/n,fz=-6.5/n;
  const dy=y-cy,dz=z-cz,depth=dy*fy+dz*fz;
  if(depth<=.01)return {x:Infinity,y:Infinity};
  const t=Math.tan(fov*Math.PI/360);
  return {x:(1+x/(depth*t*aspect))/2,y:(1-(-fz*dy+fy*dz)/(depth*t))/2};
}
export function projectedBounds({layout,xs,lookY,dist,cardWidth=1.49,cardHeight=2.79375,slotY=1.284,slotZ=4.1}){
  const points=[];
  for(const approach of [1,.94])for(const x of xs)for(const state of [{scale:1,lift:0,tilt:.55},{scale:1.08,lift:.5,tilt:.72},{scale:1.15,lift:1.1,tilt:1.05}]){
    for(const a of [-1,1])for(const b of [-1,1]){
      const h=cardHeight*state.scale/2;
      points.push(projection(x+a*cardWidth*state.scale/2,slotY+state.lift+b*h*Math.sin(state.tilt),slotZ-b*h*Math.cos(state.tilt),lookY,dist,layout.aspect,layout.fov,approach));
    }
  }
  return {left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))};
}
export function frameCards({width,height,xs=[-2.15,0,2.15],slotY=1.284,slotZ=4.1,cardWidth=1.49,cardHeight=2.79375}){
  const layout=screenLayout(width,height),opts={layout,xs,slotY,slotZ,cardWidth,cardHeight};
  function place(dist){
    let lo=-40,hi=40;
    for(let i=0;i<42;i++){
      const mid=(lo+hi)/2,b=projectedBounds({...opts,dist,lookY:mid});
      if((b.top+b.bottom)/2<(layout.top+layout.bottom)/2)lo=mid;else hi=mid;
    }
    const lookY=(lo+hi)/2,bounds=projectedBounds({...opts,dist,lookY});
    return {dist,lookY,bounds,fov:layout.fov,layout};
  }
  const fits=b=>b.left>=layout.left&&b.right<=layout.right&&b.top>=layout.top&&b.bottom<=layout.bottom;
  let lo=4,hi=7.74;
  while(!fits(place(hi).bounds)&&hi<120)hi*=1.2;
  for(let i=0;i<32;i++){const mid=(lo+hi)/2;if(fits(place(mid).bounds))hi=mid;else lo=mid;}
  return place(hi*1.015);
}
