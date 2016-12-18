```
import BungieNet from "bungienetplatformjs";

let p = new BungieNet.Platform({
  apiKey: "-api-key-here-"
});

p.helloWorld().then(r => console.log(r.response)); //Hello World
```
