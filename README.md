# Installation
Run the NPM command
```
npm i config-elements
```

# Overview
A config file reader for human-readable format that is very similar to YAML, prioritizing performance plus a lot of addition features.

This package can help large config files to be readable and clean without affecting performance nor loosing functionality. (In fact, we got *additional features!*)

> **Disclaimer**
> 
> Most yml files work with this package, but not necessarily, as it is completely written by me. Also, I got a full todo list to make it far better than YAML, todo list probably in bottom

> **What's New 0.2.1**
> 
> Added support for writing to config files, completing the original goals for the package.
> 
> Better caching, major performance improvement in caching.

# Format & Functions

A brief introduction to the package so that you can use it without trouble.

To be honest, it is really straightforward so expect no problems.

### Format

There not really any syntax, it's just the basic format and stuff

> **Any File Extensions Will Work**
> 
> I use `.cfg` because configs, it just feels right


`example.cfg`

```
# Countries I know (comment)
countries:
    - 'Japan'
    - 'USA'
    - 'UK'

# Minecraft values (comments are ignored)
minecraft:
    max_health: 20
    player1_health: NaN
    player1_name: 'steve'

    world_data:
        world_boarder: BigInt(300000000)
```

Here I'll explain:

The values of `countries` are stored in an arrays as they used `- value`, so now `countries` = `['Japan', 'USA', 'UK']`

> Note that `countries` and `Countries` are completely different

On the other hand, values in `minecraft` is not stored in an array. For example, `minecraft.player1_name` = `'steve'`. But `minecraft.max_health` doesn't have double quotes surrounding it, therefore it is stored as a number instead of a string. 

**Anything that are not surrounded by single/double quotes are not strings**

### Data Types
This package support a lot more data types then YAML package, these are the data types that it support

Strings

```
single_quotes: 'hello world'
double_quotes: "hello world"
```

Numbers

```
integer: 1
signed_integer: -69
float: 42.069
```

Booleans

```
yes: true
no: false
```

Special values

```
not_a_number: NaN
nothing: undefined
null: null
infinity: Infinity # capital 'I'
```

## Read & Write

The main use of the package is to read and write config files in a readable format. With that, we need to use 2 functions

### readSync()

This function simple "translates" config files into objects, don't know what I mean? Here I'll show you

Remember the `example.cfg` from above? The one with countries and minecraft world properties? Let's read that file with `readSync()`

`index.js`

```
// Import the package
const cfg = require('config-elements');

// Now read the file and put the data in variable "data"
var data = cfg.readSync({
    path: './example.cfg'
});

// Now data contains all the information the config file has
console.log(data.minecraft.max_health); // 20
console.log(data.countries); // ['Japan', 'USA', 'UK']

// And since "data" is an object, we can get any property with key
console.log(data['minecraft']['player1_name']); // 'steve'
```

It's quite easy to understand what is happening here, we read the file, and put the data to the variable "data".

Then the other lines are just accessing and printing out the data we had.

### writeSync()

This is the opposite of `readSync()`, what it does it translates objects back to the readable config format.

Let's continue the previous example for this.

`index.js`

```
// snippet

// change the value
data.minecraft.player1_name = 'alex'

// writeSync() will return the config file as a string
var config = cfg.writeSync({
    object: data,
    path: './example.cfg'
});

console.log(config); // prints out the formatted config file
```

So now we can read and write config files, let's take a look some additional options.

### Additional Options

Additional options for `readSync()` and `writeSync()`.

> Additional options are not required, but can be used if the function doesn't work


```
// snippet

cfg.readSync({
    content: string, // string of the config file
    path: string, // ignored when "content" is provided
    encoding: string, // file encoding
    log: boolean // enable/disable user warnings
});

cfg.writeSync({
    object: object, // object that you want to write to file
    path: string, // not required if you only want to use its return value and not writing to file
    encoding: string, // file encoding
});
```

## Settings

The `settings()` function provide further customisations to adapt to your code, or the config file.

Only enter the value/settings you want to change.

```
// snippet

cfg.settings({
    comment: string, // symbols/string to start a comment (default: '#')
    log: boolean, // display user warnings by default or not (default: true)
    space: integer // tab increment (default: 4)
});
```

# Performance

Performance is a huge factor when choosing a package, all of the tests are ran on [repl.it](https://replit.com) free version, then taken the average out of 3.

Performance is then compared to JSON - the object format for JavaScript.

> **Note**
> 
> JSON will always faster because it is literally an object, the comparison is just to show this package isn't ridiculously slow.

## Reading Small Files

How long does it takes to load small files.

> **JSON**: 0.001s
> 
> ```
> {
>   "hello": "world"
> }
> ```

> **Readable Format**: 0.002s
> 
> ```
> hello: 'world'
> ```

## Reading Large Files

To see the performance of package when reading large files

> **JSON**: 0.002s
> 
> ```
{
    "glossary": {
        "title": "example glossary",
		"GlossDiv": {
            "title": "S",
			"GlossList": {
                "GlossEntry": {
                    "ID": "SGML",
					"SortAs": "SGML",
					"GlossTerm": "Standard Generalized Markup Language",
					"Acronym": "SGML",
					"Abbrev": "ISO 8879:1986",
					"GlossDef": {
                        "para": "A meta-markup language, used to create markup languages such as DocBook.",
						"GlossSeeAlso": ["GML", "XML"]
                    },
					"GlossSee": "markup"
                }
            }
        }
    }
}
```

Although the readable format is slower, it's much cleaner for large files

> **Readable Format**: 0.006s
> 
> ```
glossary:
    title: 'example glossary'
    GlossDiv:
        title: 'S'
        GlossList:
            GlossEntry:
                ID: 'SGML'
                SortAs: 'SGML'
                GlossTerm: 'Standard Generalized Markup Language'
                Acronym: 'SGML'
                Abbrev: 'ISO 8879:1986'
                GlossDef:
                    para: 'A meta-markup language, used to create markup languages such as DocBook.'
                    GlossSeeAlso:
                        - 'GML'
                        - 'XML'
                GlossSee: 'markup'
```

# To Do

* Async functions
* Support more data types (please suggest)
* Array store objects/arrays