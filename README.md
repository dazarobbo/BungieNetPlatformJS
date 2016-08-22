```
<script src="bignumber.min.js"></script>
<script src="URI.min.js"></script>
<script src="URITemplate.js"></script>
<script src="bungienetplatformjs-0.2.1.min.js"></script>
<script>

let {BungieNet} = BungieNetJs;

let p = new BungieNet.Platform({
  apiKey: "api-key-here"
});

p.getCountsForCurrentUser().then(r => {
  //do something
}, err => {
  //error
});
```
