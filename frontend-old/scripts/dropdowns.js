// Dropdown menu for temp graph
document.getElementById('tempDrop').addEventListener('click', tempDropShow);
function tempDropShow() {
    document.getElementById('tempDropdown').classList.toggle("show");
}

// Dropdown menu for temp graph
document.getElementById('lightDrop').addEventListener('click', lightDropShow);
function lightDropShow() {
    document.getElementById('lightDropdown').classList.toggle("show");
}

// Dropdown menu for temp graph
document.getElementById('distDrop').addEventListener('click', distDropShow);
function distDropShow() {
    document.getElementById('distDropdown').classList.toggle("show");
}

window.onclick = function(event) {
    if (!event.target.matches('#tempDrop')) {
        var dropdowns = document.getElementsByClassName('temp-cont');
        for (let i = 0; i < dropdowns.length; i++) {
            const openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
    if (!event.target.matches('#lightDrop')) {
        var dropdowns = document.getElementsByClassName('light-cont');
        for (let i = 0; i < dropdowns.length; i++) {
            const openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
    if (!event.target.matches('#distDrop')) {
        var dropdowns = document.getElementsByClassName('dist-cont');
        for (let i = 0; i < dropdowns.length; i++) {
            const openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}


