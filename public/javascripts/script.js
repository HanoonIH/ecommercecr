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

gsap.from(".procard", {duration: 1, opacity: 0, y: 100, stagger: 0.15});
gsap.from(".cartItemTable", {duration: 1, opacity: 0, y: 150, stagger: 0.05});
gsap.from(".orderItemTable", {duration: .75, opacity: 0, x: -50, stagger: 0.05});
