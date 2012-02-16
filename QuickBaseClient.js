/**
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
*/

;(function($, global, undefined){
  /*jshint bitwise:false */
  "use strict";

  var defaults = {
        "apptoken": "",
        "dbid": "main",
        "realm": "https://www.quickbase.com",
        "ticket": ""
      },
      evt_prefix = "jQB-";

  /**
   * EventEmitter v3.1.4
   * https://github.com/Wolfy87/EventEmitter
   *
   * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
   * Oliver Caldwell (olivercaldwell.co.uk)
   */

  var EventEmitter = (function(){
    /**
     * EventEmitter class
     * Creates an object with event registering and firing methods
     */
    function EventEmitter() {
      // Initialise required storage variables
      this._events = {};
      this._maxListeners = 10;
    }

    /**
     * Event class
     * Contains Event methods and property storage
     *
     * @param {String} type Event type name
     * @param {Function} listener Function to be called when the event is fired
     * @param {Object} scope Object that this should be set to when the listener is called
     * @param {Boolean} once If true then the listener will be removed after the first call
     * @param {Object} instance The parent EventEmitter instance
     */
    function Event(type, listener, scope, once, instance) {
      // Store arguments
      this.type = type;
      this.listener = listener;
      this.scope = scope;
      this.once = once;
      this.instance = instance;
    }

    /**
     * Executes the listener
     *
     * @param {Array} args List of arguments to pass to the listener
     * @return {Boolean} If false then it was a once event
     */
    Event.prototype.fire = function(args){
      this.listener.apply(this.scope || this.instance, args);

      // Remove the listener if this is a once only listener
      if(this.once) {
        this.instance.removeListener(this.type, this.listener, this.scope);
        return false;
      }
    };

    /**
     * Passes every listener for a specified event to a function one at a time
     *
     * @param {String} type Event type name
     * @param {Function} callback Function to pass each listener to
     * @return {Object} The current EventEmitter instance to allow chaining
     */
    EventEmitter.prototype.eachListener = function(type, callback){
      // Initialise variables
      var i = null,
        possibleListeners = null,
        result = null;

      // Only loop if the type exists
      if(this._events.hasOwnProperty(type)) {
        possibleListeners = this._events[type];

        for(i = 0; i < possibleListeners.length; i += 1) {
          result = callback.call(this, possibleListeners[i], i);

          if(result === false) {
            i -= 1;
          }
          else if(result === true) {
            break;
          }
        }
      }

      // Return the instance to allow chaining
      return this;
    };

    /**
     * Adds an event listener for the specified event
     *
     * @param {String} type Event type name
     * @param {Function} listener Function to be called when the event is fired
     * @param {Object} scope Object that this should be set to when the listener is called
     * @param {Boolean} once If true then the listener will be removed after the first call
     * @return {Object} The current EventEmitter instance to allow chaining
     */
    EventEmitter.prototype.addListener = function(type, listener, scope, once){
      // Create the listener array if it does not exist yet
      if(!this._events.hasOwnProperty(type)) {
        this._events[type] = [];
      }

      // Push the new event to the array
      this._events[type].push(new Event(type, listener, scope, once, this));

      // Emit the new listener event
      this.emit("newListener", type, listener, scope, once);

      // Check if we have exceeded the maxListener count
      // Ignore this check if the count is 0
      // Also don't check if we have already fired a warning
      if(this._maxListeners && !this._events[type].warned && this._events[type].length > this._maxListeners) {
        // The max listener count has been exceeded!
        // Warn via the console if it exists
        if(typeof console !== "undefined") {
          console.warn("Possible EventEmitter memory leak detected. " + this._events[type].length + " listeners added. Use emitter.setMaxListeners() to increase limit.");
        }

        // Set the flag so it doesn't fire again
        this._events[type].warned = true;
      }

      // Return the instance to allow chaining
      return this;
    };

    /**
     * Alias of the addListener method
     *
     * @param {String} type Event type name
     * @param {Function} listener Function to be called when the event is fired
     * @param {Object} scope Object that this should be set to when the listener is called
     * @param {Boolean} once If true then the listener will be removed after the first call
     */
    EventEmitter.prototype.on = EventEmitter.prototype.addListener;

    /**
     * Alias of the addListener method but will remove the event after the first use
     *
     * @param {String} type Event type name
     * @param {Function} listener Function to be called when the event is fired
     * @param {Object} scope Object that this should be set to when the listener is called
     * @return {Object} The current EventEmitter instance to allow chaining
     */
    EventEmitter.prototype.once = function(type, listener, scope){
      return this.addListener(type, listener, scope, true);
    };

    /**
     * Removes the a listener for the specified event
     *
     * @param {String} type Event type name the listener must have for the event to be removed
     * @param {Function} listener Listener the event must have to be removed
     * @param {Object} scope The scope the event must have to be removed
     * @return {Object} The current EventEmitter instance to allow chaining
     */
    EventEmitter.prototype.removeListener = function(type, listener, scope){
      this.eachListener(type, function(currentListener, index){
        // If this is the listener remove it from the array
        // We also compare the scope if it was passed
        if(currentListener.listener === listener && (!scope || currentListener.scope === scope)) {
          this._events[type].splice(index, 1);
        }
      });

      // Remove the property if there are no more listeners
      if(this._events[type] && this._events[type].length === 0) {
        delete this._events[type];
      }

      // Return the instance to allow chaining
      return this;
    };

    /**
     * Alias of the removeListener method
     *
     * @param {String} type Event type name the listener must have for the event to be removed
     * @param {Function} listener Listener the event must have to be removed
     * @param {Object} scope The scope the event must have to be removed
     * @return {Object} The current EventEmitter instance to allow chaining
     */
    EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

    /**
     * Removes all listeners for a specified event
     * If no event type is passed it will remove every listener
     *
     * @param {String} type Event type name to remove all listeners from
     * @return {Object} The current EventEmitter instance to allow chaining
     */
    EventEmitter.prototype.removeAllListeners = function(type){
      // Check for a type, if there is none remove all listeners
      // If there is a type however, just remove the listeners for that type
      if(type && this._events.hasOwnProperty(type)) {
        delete this._events[type];
      }
      else if(!type) {
        this._events = {};
      }

      // Return the instance to allow chaining
      return this;
    };

    /**
     * Retrieves the array of listeners for a specified event
     *
     * @param {String} type Event type name to return all listeners from
     * @return {Array} Will return either an array of listeners or an empty array if there are none
     */
    EventEmitter.prototype.listeners = function(type){
      // Return the array of listeners or an empty array if it does not exist
      if(this._events.hasOwnProperty(type)) {
        // It does exist, loop over building the array
        var listeners = [];

        this.eachListener(type, function(evt){
          listeners.push(evt.listener);
        });

        return listeners;
      }

      return [];
    };

    /**
     * Emits an event executing all appropriate listeners
     * All values passed after the type will be passed as arguments to the listeners
     *
     * @param {String} type Event type name to run all listeners from
     * @return {Object} The current EventEmitter instance to allow chaining
     */
    EventEmitter.prototype.emit = function(type){
      // Calculate the arguments
      var args = [],
        i = null;

      for(i = 1; i < arguments.length; i += 1) {
        args.push(arguments[i]);
      }

      this.eachListener(type, function(currentListener){
        return currentListener.fire(args);
      });

      // Return the instance to allow chaining
      return this;
    };

    /**
     * Sets the max listener count for the EventEmitter
     * When the count of listeners for an event exceeds this limit a warning will be printed
     * Set to 0 for no limit
     *
     * @param {Number} maxListeners The new max listener limit
     * @return {Object} The current EventEmitter instance to allow chaining
     */
    EventEmitter.prototype.setMaxListeners = function(maxListeners){
      this._maxListeners = maxListeners;

      // Return the instance to allow chaining
      return this;
    };

    // Export the class
    return EventEmitter;
  }());

  function QuickBaseClient(opts){
    opts = $.extend({},defaults,opts);

    this._dbid = opts.dbid;
    this._apptoken = opts.apptoken;
    this._realm = opts.realm.match(/^http/) ? opts.realm : "https://" + opts.realm + ".quickbase.com";
    this._ticket = opts.ticket;
  }

  QuickBaseClient.prototype = new EventEmitter();
  QuickBaseClient.prototype.constructor = QuickBaseClient;

  QuickBaseClient.version = "3.0.0";

  QuickBaseClient.GenericErrorHandler = function(err){
    throw new Error("QuickBase Error " + err.code + ": " + err.message);
  };

  /****************************************************************************\
  |                                    AJAX                                    |
  \****************************************************************************/

  QuickBaseClient.prototype.post = function(opts){
    var data = opts.data,
        fields = opts.fields,
        xml = ["<qdbapi>"],
        promise, deferred = $.Deferred();

    function wrap(tag,str){return "<" + tag + ">" + str + "</" + tag + ">";}

    if(opts.ticket){xml.push(wrap("ticket",opts.ticket));}
    if(opts.apptoken && opts.dbid !== "main"){xml.push(wrap("apptoken",opts.apptoken));}
    for(var prop in data){
      if(data.hasOwnProperty(prop)){
        if(typeof data[prop] === "string" || typeof data[prop] === "number"){
          xml.push(wrap(prop,data[prop]));
        }else{
          throw new Error("Unknown data type for [" + prop + "]: " + (typeof data[prop]));
        }
      }
    }
    for(var field in fields){
      if(fields.hasOwnProperty(field)){
        xml.push("<field " + (field.match(/^\d+$/) ? "fid" : "name") + "=\"" + field + "\">" + fields[field] + "</field>");
      }
    }

    xml.push("</qdbapi>");

    promise = $.ajax({
      "type": "POST",
      "url": opts.realm + "/db/" + opts.dbid,
      "dataType": "xml",
      "contentType": "application/xml",
      "headers": {"QUICKBASE-ACTION": opts.action},
      "data": xml.join("")
    });
    promise.done(function(data){
        var $data = $(data);
        if($data.find("errcode").text() !== "0"){
          deferred.reject({
            "code": parseInt($data.find("errcode").text(),10),
            "message": $data.find("errtext").text()
          });
        }else{
          deferred.resolve(opts.processData($data));
        }
    });
    promise.fail(function(data){
      deferred.reject(data);
    });

    return deferred.promise();
  };

  QuickBaseClient.prototype.get = function(opts){
    var data = opts.data,
        promise, deferred = $.Deferred();
    data.act = opts.action;
    if(opts.apptoken){data.apptoken = opts.apptoken;}
    if(opts.ticket){data.ticket = opts.ticket;}

    if(opts.dbid === "main"){delete data.apptoken;}

    promise = $.ajax({
      "type": "GET",
      "url": opts.realm + "/db/" + opts.dbid,
      "data": data
    });

    promise.done(function(data){
      var $data = $(data);
      if($data.find("errcode").length > 0 && $data.find("errcode").text() !== "0"){
        deferred.reject({
          "code": $data.find("errcode").text(),
          "message": $data.find("errtext").text()
        });
      }else{
        if(opts.data_type === "raw"){
          deferred.resolve(opts.processData(data));
        }else{
          deferred.resolve(opts.processData($data));
        }
      }
    });
    promise.fail(function(data){
      deferred.reject(data);
    });

    return deferred.promise();
  };

  QuickBaseClient.prototype.defaults = function(){
    return {
      "apptoken": this.apptoken(),
      "dbid": this.dbid(),
      "ticket": this.ticket(),
      "processData": function(a){return a;},
      "data": {},
      "fields": {},
      "action": "",
      "realm": this.realm()
    };
  };

  /****************************************************************************\
  |                                 Utilities                                  |
  \****************************************************************************/

  QuickBaseClient.processTable = function($table){
    var output = {};

    output.name = $table.children("name").text();
    output.desc = $table.children("desc").text();
    output.id = $table.find("original > table_id").text();

    output.created = QuickBaseClient.to_date($table.find("original > cre_date").text());
    output.modified = QuickBaseClient.to_date($table.find("original > mod_date").text());
    output.next_record = parseInt($table.find("original > next_record_id").text(),10);
    output.next_field = parseInt($table.find("original > next_field_id").text(),10);
    output.default_sort_fid = parseInt($table.find("original > def_sort_fid").text(),10);
    output.default_sort_order = parseInt($table.find("original > def_sort_order").text(),10);

    output.variables = {};
    $table.find("variables var").each(function(){
      var name = $(this).prop("name"),
          value = $(this).text();
      if(value.match(/^\d+$/)){value = parseInt(value,10);}
      output.variables[name] = value;
    });

    output.queries = QuickBaseClient.processQueries($table.find("queries query"));

    return output;
  };

  QuickBaseClient.processFields = function($fields){
    var output = {};

    $fields.each(function(){

    });

    return output;
  };

  QuickBaseClient.processQueries = function($queries){
    var output = {};
    $queries.each(function(){
      var $query = $(this);
      output[$query.prop("id")] = {
        "name": $query.find("qyname").text(),
        "type": $query.find("qytype").text(),
        "desc": $query.find("qydesc").text(),
        "sort_list": $query.find("qyslist").text(),
        "options": $query.find("qyopts").text(),
        "columns": $query.find("qycalst").text()
      };
    });
    return output;
  };

  QuickBaseClient.to_date = function(str){
    return new Date(parseInt(str,10));
  };

  /****************************************************************************\
  |                               Configuration                                |
  \****************************************************************************/

  QuickBaseClient.prototype.apptoken = function(apptoken){
    if(apptoken !== undefined){this._apptoken = apptoken; return this;}
    return this._apptoken;
  };

  QuickBaseClient.prototype.dbid = function(dbid){
    if(dbid !== undefined){this._dbid = dbid; return this;}
    return this._dbid;
  };

  QuickBaseClient.prototype.realm = function(realm){
    if(realm !== undefined){
      if(!!~realm.indexOf("://")){
        this._realm = realm;
      }else{
        this._realm = "https://" + realm + ".quickbase.com";
      }
      return this;
    }
    return this._realm;
  };

  QuickBaseClient.prototype.ticket = function(ticket){
    if(ticket !== undefined){this._ticket = ticket; return this;}
    return this._ticket;
  };

  /****************************************************************************\
  |                               Authentication                               |
  \****************************************************************************/

  QuickBaseClient.prototype.authenticate = function(opts){
    var self = this;
    return this.get($.extend(this.defaults(),{
      "processData": function($data){
        var ticket = $data.find("ticket").text();
        self.ticket(ticket);
        return ticket;
      },
      "dbid": "main",
      "action": "API_Authenticate",
      "data": {
        "username": opts.username,
        "password": opts.password,
        "hours": opts.hours || 8
      }
    },opts));
  };

  QuickBaseClient.prototype.signout = function(opts){
    var self = this;
    return this.get($.extend(
      this.defaults(),
      {"dbid": "main","action": "API_SignOut","processData": function(){self.ticket("");}},
      opts
    ));
  };

  /****************************************************************************\
  |                       Application and Table Metadata                       |
  \****************************************************************************/

  QuickBaseClient.prototype.info = function(opts){
    // API_GetDBInfo
    return this.get($.extend(
      this.defaults(),
      {
        "action": "API_GetDBInfo",
        "processData": function($data){
          var output = {}, i, len,
              tags = ["dbname","lastRecModTime","lastModifiedTime","createdTime","numRecords","mgrID","mgrName","version","time_zone"];
          for(i = 0, len = tags.length; i < len; i++){
            if($data.find(tags[i]).length){
              output[tags[i]] = $data.find(tags[i]).text();
              if(output[tags[i]].match(/^\d+$/)){
                output[tags[i]] = parseInt(output[tags[i]],10);
                if(tags[i].match(/time/i)){
                  output[tags[i]] = new Date(output[tags[i]]);
                }
              }
            }
          }
          return output;
        }
      },
      opts
    ));
  };

  QuickBaseClient.prototype.find = function(opts){
    // API_FindDBByName
    return this.get($.extend(
      this.defaults(),
      {
        "action": "API_FindDBByName",
        "processData": function($data){
          return $data.find("dbid").text();
        },
        "data": {
          "dbname": opts.dbname,
          "parentsOnly": 1
        }
      },
      opts
    ));
  };

  QuickBaseClient.prototype.ancestors = function(opts){
    // API_GetAncestorInfo
    return this.get($.extend(
      this.defaults(),
      {
        "action": "API_GetAncestorInfo",
        "processData": function($data){
          return {
            "ancestor": $data.find("ancestorappid").text(),
            "oldest": $data.find("oldestancestorappid").text()
          };
        }
      },
      opts
    ));
  };

  QuickBaseClient.prototype.dtm = function(opts){
    // API_GetAppDTMInfo
    return this.get($.extend(
      {},
      this.defaults(),
      {
        "action": "API_GetAppDTMInfo",
        "data": {"dbid": opts.dbid},
        "processData": function($data){
          var output = {
            "req_time": new Date(parseInt($data.find("RequestTime").text(),10)),
            "next_req_time": new Date(parseInt($data.find("RequestNextAllowedTime").text(),10)),
            "app": {},
            "tables": []
          };
          var $app = $data.find("app");
          output.app.dbid = $app.prop("id");
          output.app.last_modified = new Date(parseInt($app.find("lastModifiedTime"),10));
          output.app.last_rec_modified = new Date(parseInt($app.find("lastRecModTime"),10));
          $data.find("table").each(function(){
            output.tables.push({
              "dbid": $(this).prop("id"),
              "last_modified": new Date(parseInt($(this).find("lastModifiedTime"),10)),
              "last_rec_modified": new Date(parseInt($(this).find("lastRecModTime"),10))
            });
          });
          return output;
        }
      },
      opts,
      {
        "dbid": "main"
      }
    ));
  };

  QuickBaseClient.prototype.schema = function(opts){
    // API_GetSchema
    return this.get($.extend(
      this.defaults(),
      {
        "action": "API_GetSchema",
        "processData": function($data){
          return QuickBaseClient.processTable($data.find("table"));
        }
      },
      opts
    ));
  };

  QuickBaseClient.prototype.users_roles = function(opts){
    // API_UserRoles
    return this.get($.extend(
      this.defaults(),
      {
        "action": "API_UserRoles",
        "processData": function($data){
          var output = [];
          $data.find("users user").each(function(){
            var user = {"roles": []};
            user.id = $(this).attr("id");
            user.name = $(this).find("name").text();
            $(this).find("role").each(function(){
              var role = {};
              role.id = $(this).attr("id");
              role.name = $(this).children("name").text();
              role.access = $(this).children("access").text();
              role.access_id = $(this).children("access").attr("id");
              user.roles.push(role);
            });
            output.push(user);
          });
          return output;
        }
      },
      opts
    ));
  };

  /****************************************************************************\
  |                           Application Operations                           |
  \****************************************************************************/

  QuickBaseClient.prototype.create_database = function(opts){
    // API_CreateDatabase
    return this.post($.extend(
      this.defaults(),
      {
        "dbid": "main",
        "action": "API_CreateDatabase",
        "processData": function($data){
          return {
            "dbid": $data.find("dbid").text(),
            "appdbid": $data.find("appdbid").text(),
            "apptoken": $data.find("apptoken").text()
          };
        },
        "data": {
          "dbname": opts.name || "New Application",
          "dbdesc": opts.desc || "My New QuickBase Application",
          "createapptoken": "1"
        }
      },
      opts
    ));
  };

  QuickBaseClient.prototype.delete_database = function(opts){
    // API_DeleteDatabase
    return this.post($.extend(
      this.defaults(),
      {"action": "API_DeleteDatabase"},
      opts
    ));
  };

  QuickBaseClient.prototype.clone_database = function(opts){
    // API_CloneDatabase

    var keep_data = (typeof opts.keep_data === "boolean" ? (opts.keep_data ? "1" : "0") : "1"),
        exclude_files = (typeof opts.keep_files === "boolean" ? (opts.keep_files ? "0" : "1") : "0"),
        keep_users = (typeof opts.keep_users === "boolean" ? (opts.keep_users ? "1" : "0") : "1");

    return this.post($.extend(
      this.defaults(),
      {
        "action": "API_CloneDatabase",
        "processData": function($data){
          return {
            "dbid": $data.find("newdbid").text()
          };
        },
        "data": {
          "newdbname": opts.name || "Clone of Database",
          "newdbdesc": opts.desc || "Clone of Database",
          "keepData": keep_data,
          "excludeFiles": exclude_files,
          "usersandroles": keep_users
        }
      },
      opts
    ));
  };

  QuickBaseClient.prototype.rename_database = function(opts){
    // API_RenameApp
    return this.post($.extend(
      this.defaults(),
      {
        "action": "API_RenameApp",
        "data": {
          "newappname": opts.name
        }
      },
      opts
    ));
  };

  QuickBaseClient.prototype.get_var = function(opts){
    // API_GetDBVar
    return this.get($.extend(
      this.defaults(),
      {
        "action": "API_GetDBVar",
        "data": {
          "varname": opts.name
        },
        "processData": function($data){
          return $data.find("value").text();
        }
      },
      opts
    ));
  };

  QuickBaseClient.prototype.set_var = function(opts){
    // API_SetDBVar
    return this.post($.extend(
      this.defaults(),
      {
        "action": "API_SetDBVar",
        "data": {
          "varname": opts.name,
          "value": opts.value
        }
      },
      opts
    ));
  };

  QuickBaseClient.prototype.add_page = function(opts){
    if(!opts.name){opts.name="New Page";}
    return this._write_page.call(this,opts);
  };
  QuickBaseClient.prototype.edit_page = function(opts){
    return this._write_page.call(this,opts);
  };

  QuickBaseClient.prototype._write_page = function(opts){
    // API_AddReplaceDBPage
    var data = {
      "pagetype": opts.type || "1",
      "pagebody": "<![CDATA[" + opts.body + "]]>" || ""
    };

    if(opts.id){data.pageid = opts.id;}
    if(opts.name){data.pagename = opts.name;}

    return this.post($.extend(
      this.defaults(),
      {
        "action": "API_AddReplaceDBPage",
        "data": data,
        "processData": function($data){
          return {
            "id": $data.find("pageID").text() || null
          };
        }
      },
      opts
    ));
  };

  QuickBaseClient.prototype.get_page = function(opts){
    // API_GetDBPage
    return this.get($.extend(
      this.defaults(),
      {
        "action": "dbpage",
        "data_type": "raw",
        "data": {
          "pageID": opts.id
        }
      },
      opts
    ));
  };

  QuickBaseClient.prototype.run_import = function(opts){
    // API_RunImport
  };

  QuickBaseClient.prototype.import_csv = function(opts){
    // API_ImportFromCSV
  };

  /****************************************************************************\
  |                              Field Operations                              |
  \****************************************************************************/

  QuickBaseClient.prototype.add_field = function(opts){
    return this.post($.extend(this.defaults(),
      {
        "action": "API_AddField",
        "processData": function($data){return $data.find("fid").text();},
        "data": {
          "label": opts.label || "New Field",
          "type": opts.type || "text",
        }
      },
      opts
    ));
  };

  QuickBaseClient.prototype.delete_field = function(opts){
    return this.post($.extend(
      this.defaults(),
      {
        "data": {"fid": opts.fid},
        "action": "API_DeleteField"
      },
      opts
    ));
  };

  QuickBaseClient.prototype.set_key_field = function(opts){
    // API_SetKeyField
  };

  QuickBaseClient.prototype.field_add_choices = function(opts){
    // API_FieldAddChoices
  };

  QuickBaseClient.prototype.field_remove_choices = function(opts){
    // API_FieldRemoveChoices
  };

  /****************************************************************************\
  |                             Record Operations                              |
  \****************************************************************************/

  QuickBaseClient.prototype.add_record = function(opts){
    return this.post($.extend(this.defaults(),{
      "action": "API_AddRecord",
      "fields": opts.record,
      "processData": function($data){
        var rid = parseInt($data.find("rid").text(),10);
        var updateId = parseInt($data.find("update_id").text(),10);
        return {"rid": rid,"updateId": updateId};
      }
    },opts));
  };

  QuickBaseClient.prototype.add_record_form = function(opts){
    // API_GenAddRecordForm
  };

  QuickBaseClient.prototype.change_record_owner = function(opts){
    // API_ChangeRecordOwner
  };

  QuickBaseClient.prototype.copy_master = function(opts){
    // API_CopyMasterDetail
  };

  QuickBaseClient.prototype.copy_details = function(opts){
    // API_CopyMasterDetail
  };

  QuickBaseClient.prototype.delete_record = function(opts){
    return this.post($.extend(this.defaults(),{
      "action": "API_DeleteRecord",
      "data": {"rid": opts.rid}
    },opts));
  };

  QuickBaseClient.prototype.edit_record = function(opts){
    // API_EditRecord
  };

  QuickBaseClient.prototype.query = function(opts){
    // API_DoQuery
  };

  QuickBaseClient.prototype.query_count = function(opts){
    // API_DoQueryCount
  };

  QuickBaseClient.prototype.gen_results_table = function(opts){
    // API_GenResultsTable
  };

  QuickBaseClient.prototype.record_as_html = function(opts){
    // API_GetRecordAsHTML
  };

  QuickBaseClient.prototype.record_info = function(opts){
    // API_GetRecordInfo
  };

  /****************************************************************************\
  |                              Table Operations                              |
  \****************************************************************************/

  QuickBaseClient.prototype.num_records = function(opts){
    // API_GetNumRecords
  };

  QuickBaseClient.prototype.purge = function(opts){
    // API_PurgeRecords
  };

  /****************************************************************************\
  |                              User Operations                               |
  \****************************************************************************/

  QuickBaseClient.prototype.add_user_to_role = function(opts){
    // API_AddUserToRole
  };

  QuickBaseClient.prototype.change_user_role = function(opts){
    // API_ChangeUserRole
  };

  QuickBaseClient.prototype.role_info = function(opts){
    // API_GetRoleInfo
  };

  QuickBaseClient.prototype.user_info = function(opts){
    // API_GetUserInfo
  };

  QuickBaseClient.prototype.user_role = function(opts){
    // API_GetUserRole
  };

  QuickBaseClient.prototype.provision_user = function(opts){
    // API_ProvisionUser
  };

  QuickBaseClient.prototype.remove_user = function(opts){
    // API_RemoveUserFromRole
  };

  QuickBaseClient.prototype.invite = function(opts){
    // API_SendInvitation
  };

  if(global.QuickBaseClient){
    throw new Error("QuickBaseClient has already been defined");
  }else{
    global.QuickBaseClient = QuickBaseClient;
  }
})(jQuery, typeof window === "undefined" ? this : window);
