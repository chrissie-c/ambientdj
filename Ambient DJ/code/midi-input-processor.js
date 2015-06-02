//
// midi-input-processor.js
//
// Reads a file of midi number to label mappings
// then converts incoming MIDI notes or CCs to
// label names and dispatches the value
//
// Can also do the reverse, take a symbol, convert
// that to a MIDI node number and send it back to
// the device
//
//

outlets=2;

var file = new File("");
var midibits=[];
var linesread = 0;

// trim function taken from
// http://www.hunlock.com/blogs/The_Complete_Javascript_Strings_Reference
String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g,"");
}

function to_number(val)
{
    if (!isNaN(val)) // Convert to float so Max can understand it as a number
        return parseInt(val);
    else
        return val;
}

function load()
{
	var plusfound = 0;

    if (file.isopen) {
        do {
            ln = file.readline(1024);
            if (ln == null)
                break;

            if (ln.charAt(0) == "#") // Ignore comments
                continue;

            // Split into list entries by comma & convert first value to int
            list = ln.split(",", 2);
            midinum = to_number(list[0]);
            label = list[1].trim();

            // Save in the lookup array
            midibits[midinum] = label;

			// Initialise internal structs
			sendfrom(midinum, 1);
			
        } while (++linesread < file.eof);
        file.close;
        outlet(1, 1); // Bang to show we've finished
    }
    else {
        post("File is not open\n");
    }
}

function openfile(name)
{
    // Find the file in the ../data directory of the application
    patchfile = this.patcher.filepath;
    patchdir = patchfile.substr(0,this.patcher.filepath.lastIndexOf("/"));
    filename = patchdir + "/../data/" + name;
    post("opening "+filename+"\n");

    file = new File(filename,"read","TEXT");
    if (!file.isopen) {
        error("Can't open file\n");
    }
    else {
        linesread = 0;
    }
}

// Load file
function loadfile(name)
{
    openfile(name);
    load();
}

// Receive MIDI from the device and dispatch to a receive object
function sendfrom(midi, value)
{
    //post("Sending "+value+" to "+midibits[midi]+"\n");

    // if 'include' is a parameter then also include the note/cc number in the message
    if (jsarguments.length > 1 && jsarguments[1] == "include") {
        output = [];
        output[0] = midi;
        output[1] = value;
        messnamed(midibits[midi], output);
    }
    else {
        dest = midibits[midi];
        if (dest.charAt(0) == "-") { // '-' inverts the value (for Xfader mainly)
            value = 127-value;
            dest = dest.substr(1);
        }
        messnamed(dest, value);
    }
}

// Receive MIDI label from MIDI-output and form a MIDI message for noteout
// This is the 'slow path' but that's OK as it's just UI
function sendto(label, value)
{
    output = [];

    num = midibits.indexOf(label);
    output[0] = num;
    output[1] = value;
    outlet(0, output);
}
