// small script to set current year
document.addEventListener('DOMContentLoaded', function(){
  var y = new Date().getFullYear();
  var el = document.getElementById('year');
  if(el) el.textContent = y;
});
