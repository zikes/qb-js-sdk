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
  "use strict";

  var defaults = {
        "apptoken": "",
        "dbid": "main",
        "realm": "https://www.quickbase.com",
        "ticket": ""
      },
      evt_prefix = "jQB-";

  var EventEmitter = (function(){
    /**
     * Event emitter constructor.
     *
     * @api public.
     */

    function EventEmitter(){};

    /**
     * Adds a listener.
     *
     * @api public
     */

    EventEmitter.prototype.on = function (name, fn) {
      if (!this.$events) {
        this.$events = {};
      }

      if (!this.$events[name]) {
        this.$events[name] = fn;
      } else if (isArray(this.$events[name])) {
        this.$events[name].push(fn);
      } else {
        this.$events[name] = [this.$events[name], fn];
      }

      return this;
    };

    EventEmitter.prototype.addListener = EventEmitter.prototype.on;

    /**
     * Adds a volatile listener.
     *
     * @api public
     */

    EventEmitter.prototype.once = function (name, fn) {
      var self = this;

      function on () {
        self.removeListener(name, on);
        fn.apply(this, arguments);
      };

      on.listener = fn;
      this.on(name, on);

      return this;
    };

    /**
     * Removes a listener.
     *
     * @api public
     */

    EventEmitter.prototype.removeListener = function (name, fn) {
      if (this.$events && this.$events[name]) {
        var list = this.$events[name];

        if (isArray(list)) {
          var pos = -1;

          for (var i = 0, l = list.length; i < l; i++) {
            if (list[i] === fn || (list[i].listener && list[i].listener === fn)) {
              pos = i;
              break;
            }
          }

          if (pos < 0) {
            return this;
          }

          list.splice(pos, 1);

          if (!list.length) {
            delete this.$events[name];
          }
        } else if (list === fn || (list.listener && list.listener === fn)) {
          delete this.$events[name];
        }
      }

      return this;
    };

    /**
     * Removes all listeners for an event.
     *
     * @api public
     */

    EventEmitter.prototype.removeAllListeners = function (name) {
      if (name === undefined) {
        this.$events = {};
        return this;
      }

      if (this.$events && this.$events[name]) {
        this.$events[name] = null;
      }

      return this;
    };

    /**
     * Gets all listeners for a certain event.
     *
     * @api publci
     */

    EventEmitter.prototype.listeners = function (name) {
      if (!this.$events) {
        this.$events = {};
      }

      if (!this.$events[name]) {
        this.$events[name] = [];
      }

      if (!isArray(this.$events[name])) {
        this.$events[name] = [this.$events[name]];
      }

      return this.$events[name];
    };

    /**
     * Emits an event.
     *
     * @api public
     */

    EventEmitter.prototype.emit = function (name) {
      if (!this.$events) {
        return false;
      }

      var handler = this.$events[name];

      if (!handler) {
        return false;
      }

      var args = [].slice.call(arguments, 1);

      if ('function' == typeof handler) {
        handler.apply(this, args);
      } else if (isArray(handler)) {
        var listeners = handler.slice();

        for (var i = 0, l = listeners.length; i < l; i++) {
          listeners[i].apply(this, args);
        }
      } else {
        return false;
      }

      return true;
    };

    EventEmitter.prototype.trigger = EventEmitter.prototype.emit;

    return EventEmitter;
  })();

  function QuickBaseClient(opts){
    opts = $.extend({},defaults,opts);

    this._dbid = opts.dbid;
    this._apptoken = opts.apptoken;
    this._realm = opts.realm.match(/^http/) ? opts.realm : 'https://'+opts.realm+'.quickbase.com';
    this._ticket = opts.ticket;
  }

  QuickBaseClient.prototype = new EventEmitter;
  QuickBaseClient.prototype.constructor = QuickBaseClient;

  QuickBaseClient.version = "3.0.0";

  QuickBaseClient.GenericErrorHandler = function(err){
    throw new Error("QuickBase Error "+err.code+": "+err.message);
  };

  /****************************************************************************\
  |                                    AJAX                                    |
  \****************************************************************************/

  QuickBaseClient.prototype.post = function(opts){
    var data = opts.data,
        fields = opts.fields,
        xml = ["<qdbapi>"],
        promise, deferred = $.Deferred();

    function wrap(tag,str){return "<"+tag+">"+str+"</"+tag+">";}

    if(opts.ticket){xml.push(wrap("ticket",opts.ticket))}
    if(opts.apptoken){xml.push(wrap("apptoken",opts.apptoken))}
    for(var prop in data) if(data.hasOwnProperty(prop)){
      if(typeof data[prop] === "string" || typeof data[prop] === "number"){
        xml.push(wrap(prop,data[prop]));
      }else{
        throw new Error("Unknown data type for ["+prop+"]: "+(typeof data[prop]));
      }
    }
    for(var field in fields) if(fields.hasOwnProperty(field)){
      xml.push("<field "+(field.match(/^\d+$/) ? "fid" : "name")+"=\""+field+"\">"+fields[field]+"</field>");
    }

    xml.push("</qdbapi>");

    promise = $.ajax({
      "type": "POST",
      "url": opts.realm+"/db/"+opts.dbid,
      "dataType": "xml",
      "contentType": "application/xml",
      "headers": {"QUICKBASE-ACTION":opts.action},
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
    })

    return deferred.promise();
  };

  QuickBaseClient.prototype.get = function(opts){
    var data = opts.data,
        promise, deferred = $.Deferred();
    data.act = opts.action;
    if(opts.apptoken) data.apptoken = opts.apptoken;
    if(opts.ticket) data.ticket = opts.ticket;

    promise = $.ajax({
      "type": "GET",
      "url": opts.realm+"/db/"+opts.dbid,
      "data": data
    });

    promise.done(function(data){
      var $data = $(data);
      if($data.find("errcode").text() !== "0"){
        deferred.reject({
          "code": $data.find("errcode").text(),
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

  QuickBaseClient.prototype.defaults = function(){
    return {
      "apptoken": this.apptoken(),
      "dbid": this.dbid(),
      "ticket": this.ticket(),
      "processData": function(){},
      "data": {},
      "fields": {},
      "action": "",
      "realm": this.realm()
    }
  };

  /****************************************************************************\
  |                                 Utilities                                  |
  \****************************************************************************/

  QuickBaseClient.processTable = function($table){
    var output = {};

    output.name = $table.children('name').text();
    output.desc = $table.children('desc').text();
    output.id = $table.find('original > table_id').text();

    output.created = QuickBaseClient.to_date($table.find('original > cre_date').text());
    output.modified = QuickBaseClient.to_date($table.find('original > mod_date').text());
    output.next_record = parseInt($table.find('original > next_record_id').text(),10);
    output.next_field = parseInt($table.find('original > next_field_id').text(),10);
    output.default_sort_fid = parseInt($table.find('original > def_sort_fid').text(),10);
    output.default_sort_order = parseInt($table.find('original > def_sort_order').text(),10);

    output.variables = {};
    $table.find('variables var').each(function(){
      var name = $(this).prop('name'),
          value = $(this).text();
      if(value.match(/^\d+$/)){value = parseInt(value,10);}
      output.variables[name] = value;
    });

    output.queries = QuickBaseClient.processQueries($table.find('queries query'));

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
      output[$query.prop('id')] = {
        "name": $query.find('qyname').text(),
        "type": $query.find('qytype').text(),
        "desc": $query.find('qydesc').text(),
        "sort_list": $query.find('qyslist').text(),
        "options": $query.find('qyopts').text(),
        "columns": $query.find('qycalst').text()
      };
    });
    return output;
  };

  QuickBaseClient.to_date = function(str){
    return new Date(parseInt(str,10));
  }

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
        this._realm = "https://"+realm+".quickbase.com";
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
      "data":{
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
      {dbid:"main",action:"API_SignOut",processData:function(){self.ticket("");}},
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
              tags=['dbname','lastRecModTime','lastModifiedTime','createdTime','numRecords','mgrID','mgrName','version','time_zone'];
          for(i=0,len=tags.length;i<len;i++){
            if($data.find(tags[i]).length){
              output[tags[i]] = $data.find(tags[i]).text();
              if(output[tags[i]].match(/^\d+$/)){
                output[tags[i]] = parseInt(output[tags[i]],10);
                if(tags[i].match(/time/i)){
                  output[tags[i]] = new Date(output[tags[i]])
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
          return $data.find('dbid').text();
        },
        "data":{
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
          }
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
        "data":{"dbid":opts.dbid},
        "processData": function($data){
          var output = {
            "req_time": new Date(parseInt($data.find("RequestTime").text(),10)),
            "next_req_time": new Date(parseInt($data.find("RequestNextAllowedTime").text(),10)),
            app: {},
            tables: []
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
          return QuickBaseClient.processTable($data.find('table'))
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
          var output=[];
          $data.find('users user').each(function(){
            var user = {roles:[]};
            user.id = $(this).attr('id');
            user.name = $(this).find('name').text();
            $(this).find('role').each(function(){
              var role = {};
              role.id = $(this).attr('id');
              role.name = $(this).children('name').text();
              role.access = $(this).children('access').text();
              role.access_id = $(this).children('access').attr('id');
              user.roles.push(role);
            });
            output.push(user);
          })
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
            "dbid": $data.find('dbid').text(),
            "appdbid": $data.find('appdbid').text(),
            "apptoken": $data.find('apptoken').text()
          };
        },
        "data":{
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
  };

  QuickBaseClient.prototype.clone_database = function(opts){
    // API_CloneDatabase
  };

  QuickBaseClient.prototype.rename_database = function(opts){
    // API_RenameApp
  };

  QuickBaseClient.prototype.get_var = function(opts){
    // API_GetDBVar
  };

  QuickBaseClient.prototype.set_var = function(opts){
    // API_SetDBVar
  };

  QuickBaseClient.prototype.write_page = function(opts){
    // API_AddReplaceDBPage
  };

  QuickBaseClient.prototype.get_page = function(opts){
    // API_GetDBPage
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
        "data":{
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
        "data":{"fid":opts.fid},
        "action":"API_DeleteField"
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
        return {rid:rid,updateId:updateId};
      }
    },opts))
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
    },opts))
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
