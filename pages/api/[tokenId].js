export default function handler(req, res){
  const tokeId = req.query.tokenId;
  const image_url = "https://ipfs.infura.io/ipfs/QmPLA6QTYZJoSwyZq3ai423v1vVdTq2ydnFK3rGBUn4Qqc";

  res.status(200).json({
    name: "AzogDev #" + tokenId,
    description: "AzogDev is a collection of Dev in Comic Crypto",
    image: image_url + tokenId + ".svg",
  });
}
