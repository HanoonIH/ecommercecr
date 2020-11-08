




  

//cart hbs
<section>
    <div class="container">
        <div class="row">
            <div class="col-md-8  my-5">
                <h3>My cart ({{cartItems.length}})</h3>
                <table class="table table-hover">
                    <thead class="thead-dark">
                        <tr>
                            {{!-- <th scope="col">#</th> --}}

                        </tr>
                    </thead>
                    <tbody>
                        {{#each cartItems}}
                        <tr id="cartItem{{this.product._id}}">

                            {{!-- <th scope="row">{{this._id}}</th> --}}
                            <td>
                                <img src="/images/product-images/{{this.product._id}}.jpg" style="width: 200px;" alt="">
                            </td>
                            <td>
                                <p class="h4">
                                    {{this.product.title}}
                                </p>
                                <p>{{this.product.description}}</p>
                                <p class="h4 font-weight-bold"><small>₹</small> {{this.product.price}}</p>
                            </td>

                            <td class="d-flex align-items-center">

                                <button href="" class="h2 btn btn-primary" {{#if (lte this.quantity 1)}} disabled
                                    {{/if}} onclick="changeQuantity('{{this._id}}', '{{this.product._id}}', -1)">
                                    <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-dash-circle-fill"
                                        fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                        <path fill-rule="evenodd"
                                            d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM4.5 7.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1h-7z" />
                                    </svg>
                                </button>

                                <h6 id="{{this.product._id}}"
                                    class="d-inline border border-primary rounded p-2 mx-2 align-middle">
                                    {{this.quantity}}
                                </h6>

                                <button href="" class="h2 btn btn-primary"
                                    onclick="changeQuantity('{{this._id}}', '{{this.product._id}}', 1)">
                                    <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-plus-circle-fill"
                                        fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                        <path fill-rule="evenodd"
                                            d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3v-3z" />
                                    </svg>
                                </button>


                            </td>
                            <td>
                                <a href="/remove-from-cart/{{this._id}}/{{this.product._id}}/{{this.product.title}}"
                                    class="btn btn-outline-danger">Remove</a>
                            </td>
                        </tr>
                        {{/each}}
                        
                        
                    </tbody>
                </table>
                <hr>
                            <a href="/place-order" class="btn btn-primary btn-block mt-3">PLACE ORDER</a>
                            <hr>
            </div>

            <div class="col-md-4 mt-5 align-self-start">
                <div class="border border-success rounded p-3 mt-5">

                    <h4>Price Details</h4>
                    <hr>

                    <div class="d-flex justify-content-between">
                        <p>Price ({{cartItems.length}} items)</p>
                        <p>₹ 444</p>
                    </div>

                    <div class="d-flex justify-content-between">
                        <p>Delivery charges</p>
                        <p class="text-success">Free</p>
                    </div>
                    <hr>

                    <div class="d-flex justify-content-between">
                        <h4>Total Amount</h4>
                        <h4 class="font-weight-bold"><span class="h5">₹</span> 400</h4>
                    </div>

                    <a href="/place-order" class="btn btn-primary btn-block mt-3">PLACE ORDER</a>
                </div>
            </div>
        </div>
    </div>
</section>

<script>
    function changeQuantity(cartId, productId, count) {
        let quantity = parseInt(document.getElementById(productId).innerHTML);
        count = parseInt(count);

        if (quantity == 1 && count == -1) {
            return;
        } else {
            $.ajax({
                url: '/change-product-quantity',
                data: {
                    cart: cartId,
                    product: productId,
                    count: count,
                    quantity: quantity
                },
                method: 'post',
                success: (response) => {
                    document.getElementById(productId).innerHTML = quantity + count;
                }
            })
        }

    }

</script>