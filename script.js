// Basic interactivity: year, mobile nav, typed effect, reveal on scroll, simple contact handler
document.addEventListener('DOMContentLoaded', function(){
 // year
 const yearEl = document.getElementById('year');
 if(yearEl) yearEl.textContent = new Date().getFullYear();
// mobile nav toggle
 const nav = document.getElementById('nav');
 const toggle = document.getElementById('nav-toggle');
 if(toggle && nav){
 toggle.addEventListener('click', () => {
 const isOpen = nav.classList.toggle('open');
 toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
 });
 }
 // typed effect (simple)
 const roles = ['ethical hacker', 'cyber security analyst', 'penetration tester', 'security enthusiast'];
 let rIndex = 0, pos = 0, forward = true;
 const typedEl = document.getElementById('typed');
 function tick(){
 if(!typedEl) return;
 const current = roles[rIndex];
 if(forward){
 pos++;
 typedEl.textContent = current.slice(0,pos);
 if(pos === current.length){ forward=false; setTimeout(tick,900); return; }
 } else {
 pos--;
 typedEl.textContent = current.slice(0,pos);
 if(pos === 0){ forward=true; rIndex = (rIndex+1) % roles.length; }
 }
 setTimeout(tick, 90);
 }
 if(typedEl) tick();
// reveal on scroll using IntersectionObserver
 const obs = new IntersectionObserver((entries)=>{
 entries.forEach(e=>{
 if(e.isIntersecting) e.target.classList.add('show');
 });
 }, {threshold: 0.12});
 document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}); // end DOMContentLoaded
// Simple contact form handler (placeholder)
function handleContactSubmit(){
 // Replace with Formspree, Netlify Forms, or server endpoint for real use.
 alert('Thank you — message sent (this is a demo). Replace handleContactSubmit() with a real form handler to receive messages.');
}
