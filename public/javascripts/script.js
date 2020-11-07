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
