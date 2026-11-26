// Illustrations vectorielles contextuelles, aucun effet sur les règles.
const SCENES={18:['grossesse','grossesse','grossesse','grossesse','grossesse'],48:['porte','silhouette','bol','porte'],49:['eau','robinet','eau','robinet'],50:['livres','dossier','livres','dossier'],21:['portefeuille','portefeuille','dossier','portefeuille'],20:['enveloppe','dossier','horloge'],19:['fauteuil','main','fauteuil','horloge'],30:['tasse','fauteuil','main','tasse'],22:['medical','medical','dossier','medical'],46:['bureau','horloge','tasse','bureau'],24:['voiture','dossier','voiture','enveloppe'],44:['dossier','enveloppe','main','dossier'],23:['telephone','telephone','main'],35:['cadeau','horloge','cadeau'],33:['main','livres','tasse'],47:['telephone','dossier','telephone','bureau']};
const ECHOS={'Le prix de la confiance':['porte-brisee','porte-brisee','porte-brisee','porte-brisee'],'La solidarité oubliée':['incendie','incendie','incendie','incendie'],'La solidarité retrouvée':['incendie','eau','porte'],'Le retour de la générosité':['main','enveloppe','dossier'],'L’honnêteté récompensée':['portefeuille','main','dossier'],'Une gratitude inattendue':['main','bol'],'Un secours précieux':['medical','main'],'Des voisins solidaires':['eau','robinet'],'Une porte s’ouvre':['dossier','porte'],'Un acte qui vous poursuit':['portefeuille','dossier']};
const KEY='equilibre-visuels-v1';
const mem={};try{Object.assign(mem,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch{}
function prendre(key,n){let state=mem[key];if(!state||!Array.isArray(state.left)||state.left.some(i=>!Number.isInteger(i)||i<0||i>=n))state={left:[],last:-1};if(!state.left.length){state.left=Array.from({length:n},(_,i)=>i);for(let i=n-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[state.left[i],state.left[j]]=[state.left[j],state.left[i]];}if(n>1&&state.left.at(-1)===state.last)[state.left[0],state.left[n-1]]=[state.left[n-1],state.left[0]];}const i=state.left.pop();state.last=i;mem[key]=state;try{localStorage.setItem(KEY,JSON.stringify(mem));}catch{}return i;}
export function visuelsTour(g,id){const list=SCENES[id];if(!list)return null;g.visuels??={};const key=g.history.length+':'+id;if(!g.visuels[key]){const i=prendre('s'+id,list.length);g.visuels[key]=[0,1,2].map(j=>({motif:list[(i+j)%list.length],variante:i*3+j}));}return g.visuels[key];}
export function visuelEcho(e){const list=ECHOS[e.titre];if(!list)return null;if(!e.visuel){const i=prendre('e'+e.titre,list.length);e.visuel={motif:list[i],variante:i};}return e.visuel;}
export function dessinerVisuel(spec,color='#bda875'){
 if(!spec||typeof document==='undefined')return null;
 const c=document.createElement('canvas');c.width=720;c.height=428;const x=c.getContext('2d');if(!x)return null;
 const n=spec.variante||0;const palettes=[['#101b20','#43545a','#bfa783'],['#202020','#5c4a40','#d7b88b'],['#142621','#415b51','#c5b99b'],['#1c1a29','#51485b','#d0b6a1']];const [dark,mid,light]=palettes[n%4];
 const bg=x.createRadialGradient(360,175,20,360,200,440);bg.addColorStop(0,mid);bg.addColorStop(1,dark);x.fillStyle=bg;x.fillRect(0,0,720,428);
 const line=(d,fill,stroke,w=5)=>{const p=new Path2D(d);if(fill){x.fillStyle=fill;x.fill(p);}if(stroke){x.strokeStyle=stroke;x.lineWidth=w;x.lineCap='round';x.lineJoin='round';x.stroke(p);}};
 const rect=(a,b,w,h,fill,r=12)=>{x.beginPath();x.roundRect(a,b,w,h,r);x.fillStyle=fill;x.fill();};
 const oval=(a,b,rx,ry,fill)=>{x.beginPath();x.ellipse(a,b,rx,ry,0,0,Math.PI*2);x.fillStyle=fill;x.fill();};
 const glow=x.createRadialGradient(360,340,0,360,340,280);glow.addColorStop(0,'#c4ac6c33');glow.addColorStop(1,'#00000000');x.fillStyle=glow;x.fillRect(0,0,720,428);
 x.save();x.translate(360+(n%3-1)*20,214);x.scale(1+(n%3)*.055,1+(n%3)*.055);if(n%2)x.scale(-1,1);
 const ink='#182128', bronze='#967c5e', cream=light, skin='#a56c4d', skinLight='#c68f68', accent=color;
 switch(spec.motif){
 case 'grossesse':{
 // Profil du ventre, sans visage, vêtement drapé et mains protectrices.
 const g=x.createLinearGradient(-130,-160,160,150);g.addColorStop(0,mid);g.addColorStop(.55,accent);g.addColorStop(1,dark);
 line('M-135 -190 Q-65 -155 -52 -103 Q-49 -69 7 -38 Q110 -45 145 35 Q170 117 87 159 Q8 193 -101 156 L-142 192 Z',g);
 line('M-91 -116 Q-65 -40 -17 -18 M-112 -70 Q-68 2 -42 59 M-102 140 Q-44 173 43 150',null,'#ffffff27',4);
 line('M-111 -160 Q-135 -135 -106 -102 L-38 -29 Q-20 -14 6 -4 L68 16 Q84 14 74 0 L17 -38 L-44 -132 Z',skin);
 line('M-114 175 Q-43 151 22 145 L72 113 Q95 100 109 114 Q112 126 83 145 L33 171 L-79 200 Z',skinLight);
 line('M17 -7 L48 2 M13 0 L42 10 M61 137 L81 123 M68 145 L90 130',null,'#704533',2);break;}
 case 'porte':case 'porte-brisee':{
 rect(-112,-170,224,340,ink,3);rect(-99,-158,198,316,bronze,3);rect(-82,-145,164,290,mid,3);line('M-55 -142 V140 M-12 -142 V140 M32 -142 V140',null,'#ffffff15',3);oval(58,4,8,8,cream);
 if(spec.motif==='porte-brisee'){line('M-5 -145 L-33 -46 L25 -5 L-25 52 L11 145',null,'#e0c8a1',8);line('M-155 165 L-60 139 L-80 185 M30 170 L155 150',null,bronze,10);}
 else{line('M-82 -145 L-15 -126 L-15 120 L-82 145Z','#c6ad6e55');}break;}
 case 'silhouette':oval(-85,-100,32,39,skin);line('M-115 -63 Q-150 -28 -125 65 L-83 102 L-43 91 L-56 18 L-5 63 L22 41 L-47 -42 Q-76 -76 -115 -63Z',ink);line('M-90 88 L10 110 L72 150 M-102 93 L-38 152 L35 158',null,bronze,25);break;
 case 'bol':oval(0,95,150,26,'#0b1219');line('M-145 5 Q-132 117 0 132 Q132 117 145 5Z',bronze);oval(0,5,145,47,cream);oval(0,4,120,34,'#544737');line('M-30 -20 Q-46 -57 -17 -85 M20 -20 Q44 -58 17 -93',null,'#e5d1ad66',5);break;
 case 'eau':rect(-102,-90,204,246,bronze,26);rect(-72,-145,94,65,cream,16);rect(-50,-128,50,38,dark,8);rect(52,-122,38,38,cream,6);rect(-73,-50,146,145,mid,15);line('M0 -29 Q-60 36 0 64 Q60 36 0 -29Z',cream);break;
 case 'robinet':line('M-160 -80 H50 Q100 -80 100 -30 V20',null,bronze,35);rect(-25,-135,30,55,cream);rect(-70,-140,120,15,cream);line('M100 40 Q65 87 100 109 Q135 87 100 40Z','#80b4c6');rect(-15,125,220,22,bronze);break;
 case 'incendie':line('M-175 -15 L0 -155 L175 -15 V160 H-175Z',ink,bronze,7);rect(-48,45,96,115,mid,3);rect(-140,15,66,70,'#d6a572');rect(80,15,66,70,'#d6a572');line('M-110 144 Q-190 46 -100 -37 Q-110 42 -60 64 Q-65 -38 3 -109 Q-20 0 43 39 Q85 -25 92 -70 Q170 62 110 144Z','#c87d45');line('M-45 144 Q-85 82 -20 28 Q-28 75 22 82 Q53 30 71 62 Q92 112 55 144Z','#f2c486');break;
 case 'livres':for(let i=0;i<3;i++){rect(-150+i*18,65-i*68,285-i*20,57,[bronze,cream,mid][i],6);rect(-132+i*18,76-i*68,246-i*20,32,'#e6d8bc',3);}line('M-80 -135 Q0 -165 80 -135 L80 -85 Q0 -110 -80 -85Z',cream);break;
 case 'dossier':rect(-158,-100,316,248,bronze,9);rect(-127,-140,254,245,cream,5);for(let j=0;j<5;j++)rect(-94,-94+j*28,180-(j%2)*35,5,mid,2);line('M40 74 L95 18 L110 31 L55 86 L33 92Z',ink);break;
 case 'portefeuille':rect(-157,-61,314,190,bronze,18);rect(-142,-91,270,120,cream,9);rect(-121,-76,220,84,mid,8);rect(-158,-28,316,158,'#735a49',14);rect(52,22,115,52,bronze,9);oval(128,48,9,9,cream);break;
 case 'enveloppe':rect(-157,-86,314,190,cream,9);line('M-154 -81 L0 24 L154 -81 M-153 98 L-42 2 M154 98 L42 2',null,bronze,5);oval(0,20,23,23,accent);break;
 case 'horloge':oval(0,0,140,140,bronze);oval(0,0,128,128,ink);for(let i=0;i<12;i++){const a=i*Math.PI/6;oval(Math.sin(a)*105,Math.cos(a)*105,4,4,cream);}line('M0 -75 V0 L55 35',null,cream,10);oval(0,0,9,9,cream);break;
 case 'fauteuil':rect(-110,-140,220,205,bronze,40);rect(-142,0,284,113,mid,30);rect(-160,-22,56,144,cream,20);rect(104,-22,56,144,cream,20);line('M-110 108 L-130 168 M110 108 L130 168',null,bronze,15);break;
 case 'main':line('M-240 30 L-105 -70 Q-75 -82 -35 -42 L24 5 L5 34 L-35 18 L-7 50 Q-22 75 -60 65 L-124 35 L-215 111Z',skin);line('M240 30 L105 -70 Q75 -82 35 -42 L-24 5 L-5 34 L35 18 L7 50 Q22 75 60 65 L124 35 L215 111Z',skinLight);line('M-31 -20 L25 19 M-45 6 L5 42',null,'#72513d',3);break;
 case 'tasse':oval(0,118,158,29,bronze);rect(-112,-57,190,155,cream,28);line('M76 -30 Q155 -40 137 34 Q127 70 78 60',null,cream,18);oval(-17,-55,94,24,ink);line('M-52 -91 Q-80 -129 -45 -153 M10 -91 Q30 -130 0 -155',null,'#d4c2a877',5);break;
 case 'medical':line('M-100 -145 V-35 Q-100 25 -45 25 Q10 25 10 -35 V-145 M-45 25 V75 Q-45 130 35 130 Q95 130 95 70',null,cream,14);oval(95,53,32,32,bronze);oval(95,53,18,18,cream);oval(-100,-145,12,12,bronze);oval(10,-145,12,12,bronze);break;
 case 'bureau':rect(-158,-125,316,185,ink,12);rect(-143,-110,286,155,mid,5);line('M-120 -80 H85 M-120 -54 H55 M-120 -28 H110',null,cream,5);rect(-20,60,40,58,bronze);rect(-100,116,200,13,cream);break;
 case 'voiture':line('M-180 65 L-170 8 L-116 -8 L-67 -78 H74 L129 -5 L179 18 L193 65Z',bronze);line('M-94 -10 L-51 -60 H-6 V-10Z M12 -60 H63 L101 -10 H12Z',mid);oval(-114,65,34,34,ink);oval(117,65,34,34,ink);oval(-114,65,15,15,cream);oval(117,65,15,15,cream);break;
 case 'telephone':rect(-72,-157,144,314,ink,25);rect(-62,-137,124,272,mid,15);rect(-44,-76,88,48,cream,12);rect(-35,-9,80,48,bronze,12);rect(-44,58,88,37,cream,12);break;
 case 'cadeau':rect(-125,-36,250,172,bronze,8);rect(-140,-66,280,45,cream,8);rect(-17,-66,34,202,accent,2);line('M0 -66 Q-130 -75 -82 -130 Q-45 -157 0 -66 Q130 -75 82 -130 Q45 -157 0 -66',null,cream,14);break;
 default:oval(0,0,100,100,bronze);
 }
 x.restore();const fade=x.createLinearGradient(0,0,0,428);fade.addColorStop(0,'#00000010');fade.addColorStop(.65,'#00000000');fade.addColorStop(1,'#00000077');x.fillStyle=fade;x.fillRect(0,0,720,428);return c;
}
