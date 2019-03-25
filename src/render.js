const paint = (game) => {
  (game.lasers).forEach(laser => {
    const laserWrapper = document.createElement('div');
    laserData.innerHTML = laser
    document.body.appendChild(laserWrapper);
  }); 
}

module.exports = {
  paint
}
