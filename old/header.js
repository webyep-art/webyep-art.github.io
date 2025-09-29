// header.js
document.addEventListener('DOMContentLoaded', function() {
    const headerHTML = `
        <div id="header">
            <a href="index.html" class="text_button">webyep</a>
            <span class="separator">|</span>
            <div class="dropdown">
                <a href="#" class="text_button">projects</a>
                <div class="dropdown-content">
                    <a href="luna.html">Luna</a>
                    <a href="pygame3d.html">Pygame 3D</a>
                    <a href="sorty.html">Sorty</a>
                </div>
            </div>
        </div>
    `;
    

    document.body.insertAdjacentHTML('afterbegin', headerHTML);
    
   
    const oldHeader = document.getElementById('header');
    if (oldHeader && oldHeader !== document.getElementById('header')) {
        oldHeader.remove();
    }

});

