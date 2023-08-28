# echology
Regtest custodial web-wallet that shows off [BDK](https://github.com/bitcoindevkit/bdk) (Bitcoin Dev Kit) coin selection.

* `echo` (v) Our favourite bash command.
* `ecology` (n) The science of the relationships between organisms and their environments.

## API Docs

### On Error

Error Response Body:
```json
{
    "error": {
        "code": 1,
        "message": "This error message is to be displayed to the user. The error code defines the action which the frontend performs after."
    }
}
```

### GET `/network/stats`

Response Body:
```json
{
    "height": 101, // chain height (number of blocks in the chain)
    "next_block": 1689200749, // epoch timestamp of when next block will be (can be null)
    "utxo_count": 21,

    // The UI should show anything we add here!
    "something_else": "bla",
}
```

### POST `/network/broadcast?tx={hex}`

Response Body:
```json
{
    // txid of the broadcasted tx
    "txid": "1301e99034257e945f7e5dc9311e3ac50d12e10d5f67d820a2acf3022bafb000",
}
```

### GET `/decode?tx={hex}`

Response Body:
```json
{
    // some complicated as JSON object - just display the whole object
}
```

### GET `/faucet?address={address}&amount={amount}&count={count}`

* `amount` values: 1000, 50_000, 100_000
* `count` values: 1..=10

Response Body:
```json
{
    "txids": [
        "eb7e8d79456004d8e7244d519005f8667ea1ea19f2e03897b5738d1110be1b54"
    ]
}
```

### GET `/wallet/{alias}/address`

Response Body:
```json
{
    "address": "bc1qwqdg6squsna38e46795at95yu9atm8azzmyvckulcc7kytlcckxswvvzej"
}
```

### GET `/wallet/{alias}/coins`

Response Body:
```json
{
    "coins": [
        {
            "outpoint": "eb7e8d79456004d8e7244d519005f8667ea1ea19f2e03897b5738d1110be1b54:0",
            "amount": 12000,
            "confirmations": 0,
            "spent_by": null
        },
        {
            "outpoint": "45bcb930bb7768af5d7b205d654991480e879e9ad238af1f24a5866ea1ea752b:1",
            "amount": 32100,
            "confirmations": 6,
            "spent_by": {
                "txid": "eb7e8d79456004d8e7244d519005f8667ea1ea19f2e03897b5738d1110be1b54",
                "confirmations": 0
            }
        }
    ]
}
```

### POST `/wallet/{alias}/new_spend_scenario`

Request Body:
```json
{
    "candidates": [
        {
            "outpoint": "45bcb930bb7768af5d7b205d654991480e879e9ad238af1f24a5866ea1ea752b:0",
            "must_select": false,
        }
    ],
    "recipients": [
        {
            "address": "bc1pyvdg4qnretmm5nzykh38udx7a9gyyuzma55vwuurqaldhsjvgkzqjxqwpy",
            "amount": 12000,
        }
    ],
    "max_extra_target": 0,
    "fee_rate": 1.5,
    "long_term_fee_rate": 5.0,
}
```

Response Body:
```json
{
    // unique identifier for the newly created spend-scenario
    "spend_scenario_id": "fa198711cc4cc60cfa9287984ce31514cbbe805d512e1c23d03d39ff284c7154",
}
```

### POST `/wallet/{alias}/new_solution`

Request Body:
```json
{
    "spend_scenario_id": "fa198711cc4cc60cfa9287984ce31514cbbe805d512e1c23d03d39ff284c7154",
    "algorithm": "bnb", // values: "bnb", "select_until_finished"
    // parameters are unique, based on the "algorithm" selected
    "parameters": {
        "bnb_round": 2000,
        // UI text: Use fallback algorithm?
        "fallback": false,
    },
    "excess_strategy": "best_strategy", // valid values: "best_strategy", "to_fee", "to_recipient", "to_change_output"
}
```

* Parameters for `"algorithm": "bnb"`:
    ```json
    {
        "metric": "waste", // valid values: "waste", "lowest_fee"
        // UI text: Rounds of branch and bound
        "bnb_round": 2000,
        // UI text: Use fallback algorithm?
        "fallback": false,
    }
    ```
* Parameters for `"algorithm": "select_until_finished"`:
    ```json
    {
        // UI text: Selection order
        "candidate_order": "largest_first" // values: "largest_first" (default), "smallest_first", "oldest_first", "newest_first"
    }
    ```

Response Body:
```json
{
    // send the request back to the caller
    "request": {
        "spend_scenario_id": "fa198711cc4cc60cfa9287984ce31514cbbe805d512e1c23d03d39ff284c7154",
        "algorithm": "bnb",
        "parameters": {
            "bnb_round": 2000
        }
    },
    // unix timestamp of when solution (final tx) was found
    "timestamp": 1689210543,
    // txid of the final tx
    "txid": "bc1pyvdg4qnretmm5nzykh38udx7a9gyyuzma55vwuurqaldhsjvgkzqjxqwpy",
    // the hexidecimal representation of the final tx
    "raw_tx": "01000000010470c3139dc0f0882f98d75ae5bf957e68dadd32c5f81261c0b13e85f592ff7b0000000000ffffffff02b286a61e000000001976a9140f39a0043cf7bdbe429c17e8b514599e9ec53dea88ac01000000000000001976a9148a8c9fd79173f90cf76410615d2a52d12d27d21288ac00000000",
    "metrics": {
        "waste": 5.0,
        "feerate_deviation": 0.1,
        "tx_size": 100,
        "used_excess_strategy": "best_strategy", // valid values: "best_strategy", "to_fee", "to_recipient", "to_change_output"
    }
}
```

## Admin API Docs

### POST `/admin/mine?enable={true|false}`

### POST `/admin/mine`
