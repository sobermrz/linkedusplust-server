const dns = require('dns');
const redis = require('redis');
const Post = require('./models/Post');

var firstConn = 'true';
var client = null;
const DNS_NAME = 'todolist-middle-redis-lb';

const initReidsConn = () => {
    var interval = setInterval(() => {
        if (firstConn) {
            //Search redis ip address by service name
            dns.lookup(DNS_NAME, (err, address, family) => {
                if (err) {
                    console.log('cannot get redis ip!');
                    console.log(err);
                } else {
                    console.log(
                        'Redis IP is：' + address + 'IP Family：IPV' + family
                    );

                    if (firstConn) {
                        client = redis.createClient('80', address);
                        setGetRedisDataInterval(2);
                        firstConn = false;
                    }
                }
            });
        } else {
            clearInterval(interval);
        }
    }, 1000 * 2);
};

initReidsConn();

const getData = () => {
    console.log('Start getting data from redis');
    //Get all key
    client.keys('*', function (err, keys) {
        console.log('get keys: ' + keys);
        //iterate all keys
        keys.forEach(k => {
            console.log(k);
            //get value by key
            client.get(k, (err, value) => {
                console.log('value: ' + value);
                const data = JSON.parse(value);
                console.log('Post data:');
                console.log(data);
                //save to database
                /*
                const newPost = new Post(data);
                const post = await newPost.save();
                */
                //delete data in redis by key
                client.del(k);
            });
        });
    });
};

const setGetRedisDataInterval = sec => {
    sec = sec == null ? 2 : sec;
    setInterval(getData, 1000 * sec);
};

const getClient = () => {
    return client;
};

module.exports = initReidsConn;
module.exports = setGetRedisDataInterval;
module.exports = getClient;
