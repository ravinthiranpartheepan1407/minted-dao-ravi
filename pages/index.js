import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../constants";
import { Contract, providers, utils } from "ethers";
import React,{useEffect, useState, useRef} from "react";


export default function Home() {

  const[walletConnected, setWalletConnected] = useState(false);
  const[presaleStarted, setpreSaleStarted] = useState(false);
  const[presaleEnded, setpreSaleEnded] = useState(false);
  const[loading, setLoading] = useState(false);
  const[isOwner, setIsOwner] = useState(false);
  const[tokenIdsMinted, setTokenIdsMinted] = useState("0");
  const web3Refs = useRef();

  const presaleMint = async()=>{
    try{
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      const tx = await whitelistContract.presaleMint({
        value: utils.parseEther("0.05"),
      });

      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("You have successfully minted AzogDev!")
    } catch(err){
      console.log(err);
    }
  };

  const publicMint = async()=>{
    try{
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      const tx = await whitelistContract.mint({
        value: utils.parseEther("0.05"),
      });
      setLoading(true);
      tx.wait();
      setLoading(false);
      window.alert("You have successfully minted AzogDev!");
    } catch(err){
      console.log(err);
    }
  };

  const connectWallet = async()=>{
    try{
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch(err){
      console.log(err);
    }
  };

  const startPresale = async()=>{
    try{
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      const tx = await whitelistContract.startPresale();
      setLoading(true);
      tx.wait();
      setLoading(false);
      await checkIfPresaleStarted();
    } catch(err){
      console.log(err);
    }
  };

  const checkIfPresaleStarted = async()=>{
    try{
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      const _presaleStarted = await nftContract.presaleStarted();
      if(!_presaleStarted){
        await getOwner();
      }
      setpreSaleStarted(_presaleStarted);
      return _presaleStarted;
    } catch(err){
      console.log(err);
      return false;
    }
  };

  const checkIfPresaleEnded = async()=>{
    try{
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      const _presaleEnded = await nftContract.presaleEnded();
      const hasEnded = _presaleEnded.lt(Math.floor(Date.now()/1000));
      if(hasEnded){
        setpreSaleEnded(true);
      }
      else{
        setpreSaleEnded(false);
      }
      return hasEnded;
    } catch(err){
      console.log(err);
      return false;
    }
  };

  const getOwner = async()=>{
    try{
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      const _owner = await nftContract.owner();
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      if(address.toLowerCase() === _owner.toLowerCase()){
        setIsOwner(true);
      }
    } catch(err){
      console.log(err);
    }
  };

  const getTokenIdsMinted = async()=>{
    try{
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      const _tokenIds = await nftContract.tokenIds();
      setTokenIdsMinted(_tokenIds.toString());
    } catch(err){
      console.log(err);
    }
  };

  const getProviderOrSigner = async(needSigner = false)=>{
    const provider = await web3Refs.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if(chainId !== 4){
      window.alert("change Network To Rinkeby");
      throw new Error("Change To Rinkeby");
    }
    if(needSigner){
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  useEffect(()=>{
    if(!walletConnected){
      web3Refs.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();

      const _presaleStarted = checkIfPresaleStarted();
      if(_presaleStarted){
        checkIfPresaleEnded();
      }
      getTokenIdsMinted();

      const presaleEndedInterval = setInterval(async function(){
        const _presaleStarted = await checkIfPresaleStarted();
        if(_presaleStarted){
          const _presaleEnded = await checkIfPresaleEnded();
          if(_presaleEnded){
            clearInterval(presaleEndedInterval);
          }
        }
      }, 5 * 1000);

      setInterval(async function(){
        await getTokenIdsMinted();
      }, 5 * 1000);
    }
  }, [walletConnected]);

  const renderButton = () =>{
    if(!walletConnected){
      return(<div><button onClick={connectWallet}>Connect Your Wallet</button></div>);
    }

    if(loading){
      return(<div><button>Loading...</button></div>);
    }

    if(isOwner && !presaleStarted){
      return(<div><button onClick={startPresale}>Start Presale!</button></div>);
    }
    if(!presaleStarted){
      return(<div>Presale has not started yet!</div>);
    }

    if(presaleStarted && !presaleEnded){
      return(
        <div>
          <div>Presale Has Started!! If your address is whitelisted, Mint a AzogDev</div>
          <button onClick={presaleMint}>Presale Mint</button>
        </div>
      );
    }

    if(presaleStarted && presaleEnded){
      return(
        <div>
          <button onClick={publicMint}>Public Mint </button>
        </div>
      );
    }
  };

  return (
    <div>
      <div>
        {tokenIdsMinted} / 20 have been minted
      </div>
      {renderButton()}
    </div>
  );
}
