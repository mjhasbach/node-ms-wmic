# node-ms-wmic

A Node.js wrapper for Microsoft Windows' [WMIC](https://msdn.microsoft.com/en-us/library/aa394531(v=vs.85).aspx)

## Installation
```
npm i ms-wmic
```

## API

Note: All API methods return the wmic object for chaining.

#### wmic.execute(```args```, ```cb```)

Execute WMIC with the provided `args`

* string `args` - WMIC CLI arguments
* function(null | object `err`, string `stdOut`) `cb` - A function to be called after WMIC is executed

__Example__

```
wmic.execute('process where name="notepad.exe" get executablepath', function (err, stdOut) {
    if (err) {
        console.error(err);
    }
    
    console.log(stdOut);
});
```

#### wmic.process.get(```opt```, ```cb```)

Retrieve specific process properties given one or more optional search conditions

* object `opt` - An options object
	* object{string | number} | object{object{string | number}} `where` - (Optional) An object in which a key is 
		1. `operator`, with a value of "AND" or "OR" (case-insensitive). Will determine how search conditions are joined. If omitted, conditions are joined with "AND".
		2. A process property, with a value of either a process property value to match with an equal to comparison or an object containing `operator` and `value` keys. `operator` is a [WQL operator](https://msdn.microsoft.com/en-us/library/aa394605(v=vs.85).aspx) or [LIKE Operator](https://msdn.microsoft.com/en-us/library/aa392263(v=vs.85).aspx). `value` is a process property value.
	* array{string} `get` - Process properties to get
* function(null | object `err`, array{object{string}} `processes`) `cb` - A callback to executed after the process properties are retrieved.

__Examples__

```
// Get a specific property of all processes
wmic.process.get({get: ['processId']}, function(err, processes, stdOut) {
    if (err) {
        console.error(err);
    }

    console.log(processes);
    console.log(stdOut);
});

// Simple equal to where comparison
wmic.process.get({
    where: {name: 'spotify.exe'},
    get: ['name', 'executablePath', 'threadCount']
}, function(err, processes, stdOut) {
    if (err) {
        console.error(err);
    }
    
    console.log(processes);
    console.log(stdOut);
});

// Advanced comparison via operators
wmic.process.get({
    where: {
        operator: 'OR',
        writeOperationCount: {
            operator: '>',
            value: 10
        },
        executablePath: {
            operator: 'LIKE',
            value: '%C:\\\\Program Files (x86)%chrome.exe%'
        }
    },
    get: ['workingSetSize', 'processId']
}, function(err, processes, stdOut) {
    if (err) {
        console.error(err);
    }
    
    console.log(processes);
    console.log(stdOut);
});
```

#### wmic.process.list(```where```, ```cb```)

Retrieve all available process properties given one or more optional search conditions

* object{string | number} | object{object{string | number}} `where` - (Optional) An object in which a key is 
	1. `operator`, with a value of "AND" or "OR" (case-insensitive). Will determine how search conditions are joined. If omitted, conditions are joined with "AND".
	2. A process property, with a value of either a process property value to match with an equal to comparison or an object containing `operator` and `value` keys. `operator` is a [WQL operator](https://msdn.microsoft.com/en-us/library/aa394605(v=vs.85).aspx) or [LIKE Operator](https://msdn.microsoft.com/en-us/library/aa392263(v=vs.85).aspx). `value` is a process property value.
* function(null | object `err`, array{object{string}} `processes`) `cb` - A callback to executed after the process properties are retrieved.

__Examples__

```
// Get properties of all processes
wmic.process.list(function(err, processes, stdOut) {
    if (err) {
        console.error(err);
    }

    console.log(processes);
    console.log(stdOut);
});

// Simple equal to where comparison
wmic.process.list({CSName: 'SOME-MACHINE'}, function(err, processes, stdOut) {
    if (err) {
        console.error(err);
    }
    
    console.log(processes);
    console.log(stdOut);
});

// Advanced comparison via operators
wmic.process.list({
    operator: 'OR',
    threadCount: {
        operator: '>',
        value: 1
    },
    name: {
        operator: 'LIKE',
        value: 'firef[i-p]x.exe'
    }
}, function(err, processes, stdOut) {
    if (err) {
        console.error(err);
    }

    console.log(processes);
    console.log(stdOut);
});
```

#### wmic.process.call(```opt```, ```cb```)

Execute a method on process(es) given one or more search conditions

* object `opt` - An options object
	* object{string | number} | object{object{string | number}} `where` - An object in which a key is 
		1. `operator`, with a value of "AND" or "OR" (case-insensitive). Will determine how search conditions are joined. If omitted, conditions are joined with "AND".
		2. A process property, with a value of either a process property value to match with an equal to comparison or an object containing `operator` and `value` keys. `operator` is a [WQL operator](https://msdn.microsoft.com/en-us/library/aa394605(v=vs.85).aspx) or [LIKE Operator](https://msdn.microsoft.com/en-us/library/aa392263(v=vs.85).aspx). `value` is a process property value.
	* string `call` - The method to execute
* function(null | object `err`, array{object{string}} `stdOut`) `cb` - A callback to be executed after the method is called.

__Examples__

```
// Simple equal to where comparison
wmic.process.call({
    where: { name: 'taskmgr.exe' },
    call: 'terminate'
}, function(err, stdOut) {
    if (err) {
        console.error(err);
    }

    console.log(stdOut);
});

// Advanced comparison via operators
wmic.process.call({
    where: {
        operator: 'OR',
        name: {
            operator: 'LIKE',
            value: '%ccleaner%'
        }
    },
    call: 'getowner'
}, function(err, stdOut) {
    if (err) {
        console.error(err);
    }

    console.log(stdOut);
});
```

#### wmic.process.terminate(```opt```, ```cb```)

Terminate process(es) given one or more search conditions

* object `opt` - An options object
	* object{string | number} | object{object{string | number}} `where` - An object in which a key is 
		1. `operator`, with a value of "AND" or "OR" (case-insensitive). Will determine how search conditions are joined. If omitted, conditions are joined with "AND".
		2. A process property, with a value of either a process property value to match with an equal to comparison or an object containing `operator` and `value` keys. `operator` is a [WQL operator](https://msdn.microsoft.com/en-us/library/aa394605(v=vs.85).aspx) or [LIKE Operator](https://msdn.microsoft.com/en-us/library/aa392263(v=vs.85).aspx). `value` is a process property value.
* function(null | object `err`, array{object{string}} `stdOut`) `cb` - A callback to be executed after the process(es) are terminated.

__Examples__

```
// Simple equal to where comparison
wmic.process.call({
    where: { name: 'taskmgr.exe' },
    call: 'terminate'
}, function(err, stdOut) {
    if (err) {
        console.error(err);
    }

    console.log(stdOut);
});

// Advanced comparison via operators
wmic.process.call({
    where: {
        operator: 'OR',
        name: {
            operator: 'LIKE',
            value: '%ccleaner%'
        }
    },
    call: 'getowner'
}, function(err, stdOut) {
    if (err) {
        console.error(err);
    }

    console.log(stdOut);
});
```