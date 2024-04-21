import { useEffect, useState } from 'react';
import { TextField, Box, Button, Container, Typography } from '@mui/material';
import { PandaSigner, DefaultProvider, ScryptProvider, toByteString, sha256, bsv, MethodCallOptions, SensiletSigner } from 'scrypt-ts';
import { GassedupApp } from './contracts/gassedupApp';
// import { MethodCallOptions } from 'scrypt-ts'

interface GassPumpProps {
    currentTxId: string
    amount: number
}

const GassPump: React.FC<GassPumpProps> = ({ currentTxId, amount }) => {

    const [gallons, setGallons] = useState<number>(0)
    const [octainPrice, setOctainPrice] = useState<number>(0)
    const [totalPrice, setTotalPrice] = useState<number>(0)
    const [isPumping, setIsPumping] = useState(false)
    const [areButtonsDisabled, disableButtons] = useState(false)

    function setPrice(price: number) {
        setOctainPrice(price)
    }

    useEffect(() => {
        let interval: NodeJS.Timeout | null=null

        if (isPumping) {
          interval = setInterval(() => {
            setGallons((gallons: number) => Math.round((gallons + .10)*100)/100);
          }, 100); // 1000 ms = 1 second
        } else if (!isPumping && interval) {
          clearInterval(interval)
        }

        if (isPumping) {
          disableButtons(true)
        } else {
          disableButtons(false)
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isPumping])

    useEffect(() => {
      let total = gallons * octainPrice
      if (total >= amount) {
        setIsPumping(false)
      }
      setTotalPrice(total)
    }, [gallons])

    function startPump() {
        if(!currentTxId) {
            alert('Prepay is required, please deposit Bitcoin')
        } else if(octainPrice == 0) {
            alert('Please select Octain')
        } else if (currentTxId && octainPrice > 0)
        setIsPumping(true)
    }

    function stopPump() {
        setIsPumping(false)
    }

    const callComplete = async () => {

        const provider = new DefaultProvider({
            network: bsv.Networks.testnet
        })

        // const signer = new PandaSigner(provider)
        const signer = new SensiletSigner(provider)

        const { isAuthenticated, error } = await signer.requestAuth()

        if (!isAuthenticated) {
            alert(`Buyer wallet not connected: ${error}`)
        }

        const atOutputIndex = 0

        const tx = await signer.connectedProvider.getTransaction(currentTxId)

        const instance = GassedupApp.fromTx(tx, atOutputIndex)
        console.log(instance.buyerPubKey, instance.utxo, instance.utxo.satoshis)
        await instance.connect(signer)

        // const changeAddress = await signer.getDefaultAddress()

        const nextInstance = instance.next()

        instance.bindTxBuilder('completeTransaction', GassedupApp.completeTxBuilder)

        try {
            instance.methods.completeTransaction(
                BigInt(totalPrice),
                {
                    next: {
                        instance: nextInstance,
                        balance: instance.balance
                    },
                    changeAddress: await signer.getDefaultAddress()
                }
            ).then((result) => {
                console.log(`result: ${result.tx.id}`)
            })
        } catch(error) {
            console.log(error)
        }
    }

    return (
        <>
            <Container sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', flexWrap: 'wrap', width: '66%' }}>
                <Box sx={{ border: '2px solid black', display: 'flex',  p: 1, m: 1,  }}>
                    <Typography>
                        {`Octain price: ${octainPrice}`}
                    </Typography>
                </Box>
                <Box sx={{ border: '2px solid black', display: 'flex',  p: 1, m: 1,  }}>
                    <Typography>
                        {`Total Gallons: ${gallons}`}
                    </Typography>
                </Box>
                <Box sx={{ border: '2px solid black', display: 'flex',  p: 1, m: 1,  }}>
                    <Typography>
                        {`Total Price: ${totalPrice} Satoshis`}
                    </Typography>
                </Box>
            </Container>


            <Container sx={{ justifyContent: 'center', display: 'flex', p: .03 }}>


                <Box sx={{ backgroundColor: 'gold', border: '4px solid black', display: 'flex', flexDirection: 'column', p: 1, m: 3, width: 200, height: 260 }}>
                    <Box sx={{ border: '2px solid black'}}>
                        <Typography variant='h5'sx={{ p: 2}}>
                            Price: 10 Sats
                        </Typography>
                    </Box>
                    <Typography variant='h3'sx={{ p: 2}}>
                        Regular
                    </Typography>
                    <Typography variant='h3'>
                        87
                    </Typography>
                    <Button variant="contained" sx={{ m: 2, bgcolor: 'black', "&:hover": { bgcolor: 'black' } }}
                      disabled={areButtonsDisabled}
                      onClick={() => setPrice(10)}>
                        Select
                    </Button>
                </Box>


                <Box sx={{ backgroundColor: 'gold', border: '4px solid black', display: 'flex', flexDirection: 'column', p: 1, m: 3, width: 200, height: 260 }}>
                    <Box sx={{ border: '2px solid black'}}>
                        <Typography variant='h5'sx={{ p: 2}}>
                            Price: 15 Sats
                        </Typography>
                    </Box>
                    <Typography variant='h3'sx={{ p: 2}}>
                        Plus
                    </Typography>
                    <Typography variant='h3'>
                        89
                    </Typography>
                    <Button variant="contained" sx={{ m: 2, bgcolor: 'black', "&:hover": { bgcolor: 'black' } }}
                      disabled={areButtonsDisabled}
                      onClick={() => setPrice(15)}>
                        Select
                    </Button>
                </Box>


                <Box sx={{ backgroundColor: 'gold', border: '4px solid black', display: 'flex', flexDirection: 'column', p: 1, m: 3, width: 200, height: 260 }}>
                    <Box sx={{ border: '2px solid black'}}>
                        <Typography variant='h5'sx={{ p: 2}}>
                            Price: 20 Sats
                        </Typography>
                    </Box>
                    <Typography variant='h3'sx={{ p: 2}}>
                        Premium
                    </Typography>
                    <Typography variant='h3'>
                        93
                    </Typography>
                    <Button variant="contained" sx={{ m: 2, bgcolor: 'black', "&:hover": { bgcolor: 'black' } }}
                      disabled={areButtonsDisabled}
                      onClick={() => setPrice(20)}>
                        Select
                    </Button>
                </Box>
            </Container>


            <Container>
                <Button variant="contained" sx={{ m: 2, width: '30%', bgcolor: 'green', "&:hover": { bgcolor: 'green' } }} onClick={() => startPump()}>Start</Button>
                <Button variant="contained" sx={{ m: 2, width: '30%', bgcolor: 'red', "&:hover": { bgcolor: 'red' } }} onClick={() => stopPump()}>Stop</Button>
                <Button variant="contained" sx={{ m: 2, width: '30%', bgcolor: 'grey', "&:hover": { bgcolor: 'grey' } }}  onClick={() => callComplete()}>Complete</Button>
                {/* <Button variant="contained" sx={{ m: 2, width: '30%', bgcolor: 'grey', "&:hover": { bgcolor: 'grey' } }}  onClick={() => checkObject()}>CheckObject</Button> */}
            </Container>


        </>
    )
}

export default GassPump
