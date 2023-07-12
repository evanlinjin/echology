# echology
Regtest custodial web-wallet that shows off [BDK](https://github.com/bitcoindevkit/bdk) (Bitcoin Dev Kit) coin selection.

* `echo` (v) Our favourite bash command.
* `ecology` (n) The science of the relationships between organisms and their environments.

## API Docs

### GET `/tip`

```json
{
    "height": 101,
    "hash": "00000000000000000004c4334f36518680214d6831cb6f2812045aa657267199"
}
```

### GET `/faucet?address={address}&amount={amount}`

```json
{
    "txid": "eb7e8d79456004d8e7244d519005f8667ea1ea19f2e03897b5738d1110be1b54",
}
```

### GET `/wallet:{alias}/address`

```json
{
    "address": "bc1qwqdg6squsna38e46795at95yu9atm8azzmyvckulcc7kytlcckxswvvzej"
}
```

### GET `/wallet:{alias}/coins`

```json
{
    "utxos": [
        {
            "outpoint": "eb7e8d79456004d8e7244d519005f8667ea1ea19f2e03897b5738d1110be1b54:2",
            "amount": 20000,
            "confirmations": 0
        }
    ],
    "stxos": [
        {
            "outpoint": "45bcb930bb7768af5d7b205d654991480e879e9ad238af1f24a5866ea1ea752b:0",
            "amount": 12000,
            "confirmations": 6,
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
