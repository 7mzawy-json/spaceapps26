/* Original educational illustrations, AI-assisted by OpenAI Codex. No measured flame dimensions or velocities. */
(function () {
  'use strict';
  var reduce=matchMedia('(prefers-reduced-motion: reduce)');
  function flow(root,options) {
    options=options||{};
    var canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d'),g=0,fan=false,paused=reduce.matches,visible=true,t=0,last=0,palette;
    function colors(){var s=getComputedStyle(root);palette={ink:s.getPropertyValue('--ink').trim(),muted:s.getPropertyValue('--muted').trim(),line:s.getPropertyValue('--line').trim(),blue:s.getPropertyValue('--brand').trim(),bg:s.getPropertyValue('--well').trim(),dark:document.documentElement.dataset.theme==='dark'};}
    colors();new MutationObserver(colors).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
    function draw(){
      var W=640,H=340,cx=320,cy=190,k=Math.sqrt(g),R=48,fy=cy+24*k;
      ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);ctx.clearRect(0,0,W,H);
      ctx.strokeStyle=palette.line;ctx.lineWidth=.6;
      for(var x=40;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,20);ctx.lineTo(x,H-20);ctx.stroke();}
      for(var y=30;y<H;y+=40){ctx.beginPath();ctx.moveTo(20,y);ctx.lineTo(W-20,y);ctx.stroke();}
      // Gas paths: isotropic diffusion in still microgravity, convection when g>0, horizontal transport with a fan.
      var paths=[];
      if(fan){for(var j=0;j<5;j++)paths.push([[38,100+j*36],[225,100+j*36],[400,100+j*36],[602,100+j*36]]);}
      else if(g<.015){for(var a=0;a<8;a++){var ang=a*Math.PI/4,dx=Math.cos(ang),dy=Math.sin(ang);paths.push([[cx+dx*185,cy+dy*125],[cx+dx*155,cy+dy*100],[cx+dx*90,cy+dy*80],[cx+dx*55,cy+dy*48]]);}}
      else {paths=[[[100,265],[165,270],[245,265],[290,220]],[[540,265],[475,270],[395,265],[350,220]],[[290,205],[255,130],[270,70],[260,32]],[[350,205],[385,130],[370,70],[380,32]]];}
      function at(p,u){var q=1-u;return[p[0][0]*q*q*q+3*p[1][0]*q*q*u+3*p[2][0]*q*u*u+p[3][0]*u*u*u,p[0][1]*q*q*q+3*p[1][1]*q*q*u+3*p[2][1]*q*u*u+p[3][1]*u*u*u];}
      paths.forEach(function(p,i){
        ctx.strokeStyle=palette.dark?'#85bafa35':'#2a60924a';ctx.lineWidth=1.2;ctx.setLineDash([3,7]);ctx.beginPath();ctx.moveTo(...p[0]);ctx.bezierCurveTo(...p[1],...p[2],...p[3]);ctx.stroke();ctx.setLineDash([]);
        for(var n=0;n<3;n++){var u=(n/3+t*(fan?.18:g>.015?.11+.10*k:.07)+i*.09)%1,v=at(p,u);ctx.beginPath();ctx.fillStyle=!fan&&g>.015&&i>1?'#d7794e':palette.dark?'#a7d9ff':'#2860a2';ctx.arc(v[0],v[1],2.6,0,Math.PI*2);ctx.fill();}
        var tip=at(p,.88),tail=at(p,.84),ang=Math.atan2(tip[1]-tail[1],tip[0]-tail[0]);ctx.strokeStyle=palette.dark?'#a7c9e3':'#346089';ctx.beginPath();ctx.moveTo(tip[0]-8*Math.cos(ang-.5),tip[1]-8*Math.sin(ang-.5));ctx.lineTo(...tip);ctx.lineTo(tip[0]-8*Math.cos(ang+.5),tip[1]-8*Math.sin(ang+.5));ctx.stroke();
      });
      // A continuous round-to-stretched silhouette. The equation panel, not this shape, carries the quantitative comparison.
      ctx.save();ctx.beginPath();
      for(var z=0;z<=96;z++){var ang=z/96*Math.PI*2,up=Math.max(0,Math.sin(ang)),bend=fan?26*up:0;var px=cx+R*Math.cos(ang)*(1-.35*k*up)+bend,py=cy-R*Math.sin(ang)*(1+1.65*k*up);z?ctx.lineTo(px,py):ctx.moveTo(px,py);}
      ctx.closePath();var grad=ctx.createRadialGradient(cx,cy,5,cx,cy-15*k,90);grad.addColorStop(0,palette.dark?'#eea76618':'#ed8c3310');grad.addColorStop(.48,palette.dark?'#7b9ee82b':'#25569d18');grad.addColorStop(.75,'#4d9cfa85');grad.addColorStop(1,'#285fb120');ctx.fillStyle=grad;ctx.fill();ctx.strokeStyle=palette.dark?'#82bcff':'#2766b5';ctx.lineWidth=3;ctx.shadowColor='#398aff';ctx.shadowBlur=12;ctx.stroke();ctx.shadowBlur=0;
      ctx.beginPath();ctx.fillStyle=palette.dark?'#ffcd91':'#b55c22';ctx.arc(cx,fy,5,0,Math.PI*2);ctx.fill();ctx.restore();
      ctx.fillStyle=palette.ink;ctx.font='500 13px Arial';ctx.fillText(fan?'Ventilation fan on':g<.015?'Still gas in microgravity':'Buoyancy-driven flow',24,28);
      ctx.fillStyle=palette.muted;ctx.font='12px Arial';ctx.fillText('Fuel source',cx-32,cy+92);ctx.fillText('Illustration; paths and flame size are not measured',24,H-13);
      root.dataset.g=String(g);root.dataset.fan=String(fan);root.dataset.paused=String(paused);
    }
    function resize(){var r=canvas.getBoundingClientRect();canvas.width=Math.max(1,Math.round(r.width*Math.min(devicePixelRatio,2)));canvas.height=Math.max(1,Math.round(r.height*Math.min(devicePixelRatio,2)));draw();}
    new ResizeObserver(resize).observe(canvas);new IntersectionObserver(function(e){visible=e[0].isIntersecting;}).observe(root);
    var listener=function(){if(reduce.matches)paused=true;draw();};reduce.addEventListener('change',listener);
    function tick(now){var dt=Math.min(.05,(now-last)/1000||0);last=now;if(visible&&!document.hidden&&!root.closest('[inert]')&&root.getClientRects().length){if(!paused)t+=dt;draw();}requestAnimationFrame(tick);}requestAnimationFrame(tick);
    return {set:function(value,wind){g=Math.max(0,Math.min(1,value));fan=!!wind;draw();},pause:function(value){paused=value;draw();},get:function(){return{g:g,fan:fan,paused:paused};}};
  }
  window.FlashpointStudies={flow:flow};
})();
