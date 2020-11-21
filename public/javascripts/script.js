
function addToCart(productId) {
    $.ajax({
        url:"/add-to-cart/" + productId,
        method: 'get',
        success: (response) => {
            if(response.status){
                let count = $('#cartCount').html();
                count = parseInt(count) + 1;
                $('#cartCount').html(count);
            }
        }
    })
}

function addToFavourite(productId) {
    $.ajax({
        url: "/add-to-favourites/" + productId,
        method: 'get',
        success: (response) => {
            console.log('successssss');
            location.reload();
        }
    })
}

function moveToFavourite(cartId, productId, title) {
    $.ajax({
        url: "/add-to-favourites/" + productId,
        method: 'get',
        success: (response) => {
            location.href = `/remove-from-cart/${cartId}/${productId}/${title}`
        }
    })
}

function removeFromFavourite(productId) {
    $.ajax({
        url: "/remove-from-favourites/" + productId,
        method: 'get',
        success: (response) => {
            console.log('successssss removed from favourites');
            location.reload();
        }
    })
}

gsap.from(".procard", {duration: 1, opacity: 0, y: 100, stagger: 0.15});
gsap.from(".orderItemTable", {duration: .75, opacity: 0, x: -50, stagger: 0.05});
gsap.from(".cartItemTable", {duration: .75, opacity: 0, x: -50, stagger: 0.05}); 
gsap.from(".favouriteItemTable", {duration: .75, opacity: 0, y: 50, stagger: 0.05}); 
