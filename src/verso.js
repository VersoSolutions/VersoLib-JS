/**
 * Wrapper for services of versocards.com
 */
Verso.Services = (function () {
    var encoding = Verso.Encoding;

    /**
     * Get card information associated to an authID
     *
     * @param  {ByteArray}  authID   The card authID
     * @param  {Function}   onInfos  Function called when the card name is received
     * @param  {Function}   onError  Function called in case of error
     */
    var cardDetails = function (authID, onInfos, onError) {
        $.ajax({
            type: "POST",
            url: "https://versocards.com/api/cardDetails/",
            data: {
                "authID": encoding.bytesToBase16(authID)
            },
            success: function (res) {
                res = JSON.parse(res);

                if (!res.error) {
                    onInfos({ name: res.name });
                }
                else if (onError) {
                    onError(new Verso.CredentialsError("Invalid credentials!"));
                }
            },
            error: function (xhr, opt, err) {
                if (onError)
                    onError(new Verso.ConnectionError("Connection problem!"));
            }
        });
    };

    /**
     * Get the indices of the deterministic addresses associated to an authID (e.g. k for m/k such as in BIP0032)
     *
     * @param  {ByteArray}  authID   The card authID
     * @param  {Function}   onInfos  Function called when the card name is received
     * @param  {Function}   onError  Function called in case of error
     */
    var indices = function (authID, onIndices, onError) {
        // TODO: Finish this.
        onIndices([]);
        return;

        // jQuery.ajax({
        //     type: "POST",
        //     url: "https://versocards.com/api/indices/",
        //     data: {
        //         "authID": encoding.bytesToBase16(authID)
        //     },
        //     success: function (res) {
        //         res = JSON.parse(res);

        //         if (!res.error) {
        //             var indices = [];

        //             for (var i = 0; i < res.indices; i++) {
        //                 indices.push(parseInt(res.onIndices[i]));
        //             }
        //             onIndices({ name: res.name });
        //         }
        //         else if (onError) {
        //             onError(new Verso.CredentialsError("Invalid credentials!"));
        //         }
        //     },
        //     error: function (xhr, opt, err) {
        //         if (onError)
        //             onError(new Verso.ConnectionError("Connection problem!"));
        //     }
        // });
    };

    /**
     * Get the encrypted seed share associated to a Gold Card
     *
     * @param  {ByteArray}  authID   The card authID
     * @param  {ByteArray}  authKey  The user authKey
     * @param  {Function}   onShare  Function called when the share is received
     * @param  {Function}   onError  Function called in case of error
     */
    var seedShare = function (authID, authKey, onShare, onError) {
        $.ajax({
            type: "POST",
            url: "https://versocards.com/api/seedShare/",
            data: {
                "authID": encoding.bytesToBase16(authID),
                "authKey": encoding.bytesToBase16(authKey)
            },
            success: function (res) {
                res = JSON.parse(res);

                if (res.seed !== undefined && res.seed != "false") {
                    onShare(encoding.base16ToBytes(res.seed));
                }
                else if (onError) {
                    onError(new Verso.CredentialsError("Invalid credentials!"));
                }
            },
            error: function (xhr, opt, err) {
                if (onError)
                    onError(new Verso.ConnectionError("Connection problem!"));
            }
        });
    };

    /**
     * Get some entropy from server /dev/urandom
     *
     * @param  {ByteArray}  authID     The card authID
     * @param  {Integer}    n          The number of desired bytes
     * @param  {Function}   onEntropy  Function called when the entropy is received
     * @param  {Function}   [onError]  Function called in case of error
     */
    var entropy = function (authID, n, onEntropy, onError) {
        $.ajax({
            type: "POST",
            url: "https://versocards.com/api/entropy/",
            data: {
                "authID": encoding.bytesToBase16(authID),
                "nBytes": n
            },
            success: function (res) {
                res = JSON.parse(res);

                if (res.entropy !== undefined && res.seed != "false") {
                    onEntropy(encoding.base16ToBytes(res.entropy));
                }
                else if (onError) {
                    onError(new Verso.CredentialsError("Invalid credentials!"));
                }
            },
            error: function (xhr, opt, err) {
                if (onError)
                    onError(new Verso.ConnectionError("Connection problem!"));
            }
        });
    };

    return {
        cardDetails: cardDetails,
        seedShare: seedShare,
        entropy: entropy
    };
})();

Verso.Settings.rsaKey = {
    modulus: "ad8d4433ba0b7401b6be9876e85ff28d6f9a36f580833188715c05b87ca9a045871433fa31aa0290a04982553afb4741fb5956e8743f16b75b36eb31276eebd1f00d2731bdce73fcf2d09a879a1b3343d889d1b6a5ed45caccadf0d4d44eed6c6da4f4cbbfe7f67dbf97950fcc4ec9a36dcd45bdb13803b3f6dd86021e73610f11d5ff95901070cccc7dc586269687724aee2cfe37bbf169a1c1c005ad51d996f29f93ad9535fb65c5c625cad415f52fb481006c517e6c978a2d2792c7fb98e84d843c13363575e0fabbf4a0a80c5df2d9df67f00219f22446272bafe2fd7b5780f7d82058001ef746fb63e1c54aa3960d3612affe40aeb9b8b9668798c65219",
    exponent: "010001"
};