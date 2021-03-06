describe('QuickBaseClient', function(){
  var apptoken="b35ijpduxr7rrbwge2ced3zwvke",
      app_dbid="bgwzttrag",
      table_dbid="bgwzttrbv",
      table2_dbid="bgyf9wd72";

  if(!config){
    alert('config.js has not been included.');
    return;
  }

  describe('Static Properties', function(){
    it('should have a version', function(){
      expect(QuickBaseClient.version).to.be.a('string');
    });
  });
  describe('Initialization', function(){
    it('should initialize to defaults with no options specified', function(){
      var qbc = new QuickBaseClient();
      expect(qbc._dbid).to.equal('main');
      expect(qbc._realm).to.equal('https://www.quickbase.com');
      expect(qbc._apptoken).to.equal('');
    });
  });
  describe('Configuration', function(){
    var qbc;

    beforeEach(function(){
      qbc = new QuickBaseClient();
    })

    describe('#dbid()', function(){
      it('should return default properties unless set', function(){
        expect(qbc.dbid()).to.equal('main');
      });
      it('should return the QuickBaseClient instance when set', function(){
        expect(qbc.dbid(app_dbid)).to.be.an.instanceof(QuickBaseClient);
      });
      it('should save the properties and return them when requested', function(){
        qbc.dbid(app_dbid);
        expect(qbc.dbid()).to.equal(app_dbid);
      });
    });
    describe('#apptoken()', function(){
      it('should return default properties unless set', function(){
        expect(qbc.apptoken()).to.equal('');
      });
      it('should return the QuickBaseClient instance when set', function(){
          expect(qbc.apptoken(apptoken)).to.be.an.instanceof(QuickBaseClient);
      });
      it('should save the properties and return them when requested', function(){
        qbc.apptoken(apptoken)
        expect(qbc.apptoken()).to.equal(apptoken);
      });
    });
    describe('#realm()', function(){
      it('should return default properties unless set', function(){
        expect(qbc.realm()).to.equal('https://www.quickbase.com');
      });
      it('should return the QuickBaseClient instance when set', function(){
        expect(qbc.realm('https://wmt.quickbase.com')).to.be.an.instanceof(QuickBaseClient);
      });
      it('should save the properties and return them when requested', function(){
        qbc.realm('https://wmt.quickbase.com')
        expect(qbc.realm()).to.equal('https://wmt.quickbase.com');
      });
      it('should accept a subdomain as well as fully qualified URL', function(){
        qbc.realm('wmt');
        expect(qbc.realm()).to.equal('https://wmt.quickbase.com');
      });
    });
    describe('#ticket()', function(){
      it('should return default properties unless set', function(){
        expect(qbc.ticket()).to.equal('');
      });
      it('should return the QuickBaseClient instance when set', function(){
        expect(qbc.ticket('abc123abc123')).to.be.an.instanceof(QuickBaseClient);
      });
      it('should save the properties and return them when requested', function(){
        qbc.ticket('abc123abc123')
        expect(qbc.ticket()).to.equal('abc123abc123');
      });
    });
  });
  describe('Events', function(){
    it('should register and fire', function(done){
      var qbc = new QuickBaseClient();
      qbc.on('test1',done);
      qbc.emit('test1');
    });
  });
  describe('Authentication',function(){
    describe('#authenticate()', function(logged_in){
      var qbc = new QuickBaseClient({realm:'wmt'}),
          auth_promise = qbc
            .authenticate({
              username:config.username,
              password:config.password
            });

      it('should complete successfully', function(done){
        auth_promise
          .done(function(){
            done()
          })
          .fail(function(err){
            console.log(err);
            done(new Error(err.message));
          });
      });
      it('should acquire a ticket', function(done){
        auth_promise.done(function(){
          expect(qbc.ticket()).to.not.equal('abc123abc123');
          done();
        });
      });
    });
    describe('#signout()', function(){
      var qbc = new QuickBaseClient({realm:'wmt',apptoken:apptoken}),
          auth_promise = qbc
            .authenticate({
              username:config.username,
              password:config.password
            }),
          ticket,
          signout_promise;

      it('should complete successfully', function(done){
        this.timeout(0);
        auth_promise.done(function(){
          ticket = qbc.ticket();
          signout_promise = qbc.signout();
          signout_promise.done(function(){
            done();
          });
        });
      });
      it('should clear the ticket', function(done){
        this.timeout(0);
        auth_promise.done(function(){
          signout_promise.done(function(){
            expect(qbc.ticket()).to.equal('');
            done();
          });
        });
      });
      it('should be somewhat useless since the ticket still works', function(done){
        qbc
          .authenticate({username:config.username,password:config.password})
          .done(function(){
            done();
          });
      });
    });
  });
  describe('Application and Table Metadata',function(){
    var qbc;
    beforeEach(function(){
      qbc = new QuickBaseClient({realm:'wmt',apptoken:apptoken});
    });
    describe('#info()',function(){
      var props = ['createdTime','dbname','lastModifiedTime','lastRecModTime','mgrID','mgrName','numRecords','time_zone','version'];
      it('should complete successfully',function(done){
        qbc.info({'dbid':app_dbid}).done(function(){done()});
      })
      it('should return all appropriate application data',function(done){
        qbc.info({
          dbid: app_dbid
        }).done(function(data){
          for(var i = 0; i < props.length; i++){
            if(!data.hasOwnProperty(props[i])) done(new Error('Missing property: '+props[i]));
          }
          done();
        }).fail(function(err){
          done(err)
        })
      });
      it('should return all appropriate table data',function(done){
        qbc.info({
          dbid: table_dbid
        }).done(function(data){
          for(var i = 0; i < props.length; i++){
            if(!data.hasOwnProperty(props[i])) done(new Error('Missing property: '+props[i]));
          }
          done();
        }).fail(function(err){
          done(err)
        });
      });
    });
    describe('#find()',function(){
      it('should complete successfully',function(done){
        qbc.find({'dbname':'Store Layout'}).done(function(){
          done();
        });
      });
      it('should return appropriate results',function(done){
        qbc.find({'dbname':'Store Layout'}).done(function(data){
          expect(data).to.equal('bdexnyifp');
          done();
        });
      });
    });
    describe('#ancestors()',function(){
      var qbc = new QuickBaseClient({realm:'wmt',apptoken:apptoken});
      var promise = qbc.ancestors({dbid:app_dbid});
      it('should complete successfully',function(done){
        promise.done(function(){
          done();
        });
      });
      it('should return appropriate results',function(done){
        promise.done(function(info){
          expect(info).to.have.keys(['ancestor','oldest']);
          done();
        });
      });
    });
    describe('#dtm()',function(){
      var qbc = new QuickBaseClient({realm:'wmt',apptoken:apptoken});
      var promise = qbc.dtm({dbid:app_dbid});
      it('should complete successfully',function(done){
        promise.done(function(){
          done();
        });
      });
      it('should return appropriate results',function(done){
        promise.done(function(info){
          expect(info).to.contain.keys(['app','next_req_time','req_time','tables']);
          expect(info.app).to.contain.keys(['dbid','last_modified','last_rec_modified']);
          expect(info.tables).to.be.a('array');
          done();
        });
      });
    });
    describe('#schema(app)',function(){
      var qbc = new QuickBaseClient({realm:'wmt',apptoken:apptoken});
      var promise = qbc.schema({dbid:app_dbid});
      it('should complete successfully',function(done){
        promise.done(function(){done()});
      });
      it('should return appropriate results',function(done){
        promise.done(function(schema){
          expect(schema).to.contain.keys([
            'name','desc','id','created','modified','next_record','next_field',
            'default_sort_fid','default_sort_order','variables','children'
          ]);
          done();
        });
      });
      it('should fail on nonexistent DBIDs',function(done){
        qbc.schema({dbid:'abc123'}).fail(function(data){
          done();
        })
      });
    });
    describe('#schema(table)',function(){
      var qbc = new QuickBaseClient({realm:'wmt',apptoken:apptoken});
      var promise = qbc.schema({dbid:table_dbid});
      it('should complete successfully',function(done){
        promise.done(function(){done()});
      });
      it('should return appropriate results',function(done){
        promise.done(function(schema){
          expect(schema).to.contain.keys([
            'name','desc','id','created','modified','next_record','next_field',
            'default_sort_fid','default_sort_order','variables','children',
            'queries','fields'
          ]);
          done();
        });
      });
    });
    describe('#users_roles()',function(){
      var qbc = new QuickBaseClient({realm:'wmt',apptoken:apptoken});
      var promise = qbc.users_roles({dbid:app_dbid});
      it('should complete successfully',function(done){
        promise.done(function(){done()});
      });
      it('should return appropriate results',function(done){
        promise.done(function(data){
          expect(data[0]).to.contain.keys(['id','name','roles']);
          expect(data[0].roles[0]).to.contain.keys(['access','access_id','id','name']);
          done();
        });
      });
    });
  });
  describe('Application Operations',function(){
    var qbc, new_app_promise;
    beforeEach(function(){
      qbc = new QuickBaseClient({realm:'wmt',apptoken:apptoken});
    });
    describe('#create_database()',function(){
      var qbc = new QuickBaseClient({realm:'wmt',apptoken:apptoken});;
      new_app_promise = qbc.create_database({
          'name': 'Test Application',
          'desc': 'My Test Application'
      });
      it('should complete successfully',function(done){
        new_app_promise.done(function(){done();});
      });
      it('should return appropriate results',function(done){
        new_app_promise.done(function(data){
          expect(data).to.contain.keys(['dbid','appdbid','apptoken']);
          done();
        });
      });
    });
    describe('#delete_database()',function(){
      it('should complete successfully',function(done){
        this.timeout(0);
        new_app_promise.done(function(data){
          qbc.delete_database({dbid:data.appdbid,apptoken:data.apptoken}).done(function(){
            done();
          });
        });
      });
    });
    describe('#clone_database()',function(){
      var promise;
      it('should complete successfully',function(done){
        promise = qbc.clone_database({
          dbid:app_dbid,
          name:'Clone of Test App',
          desc:'Clone of Test App'
        }).done(function(data){
          done();
        })
      });
      it('should return appropriate results',function(done){
        promise.done(function(data){
          if(data.dbid){
            done();
            qbc.delete_database({dbid:data.dbid});
          }
        })
      });
    });
    describe('#rename_database()',function(){
      it('should complete successfully',function(done){
        qbc.rename_database({
          dbid:app_dbid,
          name:'Rename of Javascript SDK Testing Grounds'
        }).done(function(){
          qbc.schema({dbid:app_dbid}).done(function(data){
            if(data.name==='Rename of Javascript SDK Testing Grounds'){
              done();
              qbc.rename_database({
                dbid:app_dbid,
                name:'Javascript SDK Testing Grounds'
              });
            }else{
              done(new Error('rename_database failed to change application name'));
            }
          });
        });
      });
    });
    describe('#get_var()',function(){
      var promise;
      it('should complete successfully',function(done){
        promise = qbc.get_var({
          dbid:app_dbid,
          name:'Test_Read'
        }).done(function(){
          done();
        });
      });
      it('should return appropriate results',function(done){
        promise.done(function(data){
          if(data === '1'){
            done();
          }else{
            done(new Error());
          }
        })
      });
    });
    describe('#set_var()',function(){
      it('should complete successfully',function(done){
        qbc.set_var({
          dbid:app_dbid,
          name:'Test_Set',
          value:'set'
          }).done(function(){
            qbc.get_var({
              dbid:app_dbid,
              name:'Test_Set'
            }).done(function(data){
              if(data === 'set'){
                done();
              }else{
                done(new Error());
              }
            });
          });
      });
    });
    describe('#add_page()',function(){
      var promise;
      it('should complete successfully',function(done){
        promise = qbc.add_page({
          dbid:app_dbid,
          name:'add_test.htm',
          body:'<!doctype html>\n<html>\n\t<head>\n\t\t<title>Test Page</title>\n\t</head>\n\t<body>\n\t\t<h1>Test Page</h1>\n\t</body>\n</html>'
        }).done(function(){
          done();
        })
      });
      it('should return appropriate results',function(done){
        promise.done(function(data){
          if(data.id){
            done();
          }else{
            done(new Error());
          }
        })
      });
    });
    describe('#edit_page()',function(){
      it('should complete successfully',function(done){
        qbc.edit_page({
          dbid:app_dbid,
          id: 11,
          body:'edited'
        }).done(function(data){
          done();
        });
      });
    });
    describe('#get_page()',function(){
      var qbc = new QuickBaseClient({realm:'wmt',apptoken:apptoken});
      var promise = qbc.get_page({dbid:app_dbid,id:12});
      it('should complete successfully',function(done){
        promise.done(function(){done()});
      });
      it('should return appropriate results',function(done){
        promise.done(function(data){
          expect(data).to.have.string('</html>');
          done();
        });
      });
    });
    describe('#run_import()',function(){
      var promise;
      it('should complete successfully',function(done){
        promise = qbc.run_import({
          dbid:table2_dbid,
          id:10
        }).done(function(){done();});
      });
      it('should return appropriate results',function(done){
        promise.done(function(message){
          if(!!~message.indexOf('new record') && !!~message.indexOf('created')){
            done();
          }else{
            done(new Error());
          }
        });
      });
    });
    describe('#import_csv()',function(){
      var qbc = new QuickBaseClient({realm:'wmt',apptoken:apptoken});
      var promise = qbc.import_csv({
        dbid:table2_dbid,
        csv:"Test2,2,01-02-1921,0,Jason.Hutchinson@wal-mart.com\nTest3,3,01-02-1922,1,Terry.Corp@wal-mart.com",
        columns:"6.7.8.9.10"
      });
      it('should complete successfully',function(done){
        promise.done(function(){
          done();
        });
      });
      it('should return appropriate results',function(done){
        promise.done(function(data){
          expect(data).to.contain.keys(['added','input','rids','updated']);
          expect(data.added).to.be.a('number');
          expect(data.input).to.be.a('number');
          expect(data.updated).to.be.a('number');
          expect(data.rids).to.be.a('array');
          done();
        });
      });
    });
  });
  describe('Field Operations', function(){
    var add_field_promise, del_field_promise, new_fid, qbc;
    beforeEach(function(){
      qbc = new QuickBaseClient({realm:'wmt',apptoken:apptoken});
    });
    describe('#add_field()', function(){
      it('should complete successfully', function(done){
        this.timeout(0);
        add_field_promise = qbc.add_field({
          'dbid': table_dbid,
          'label': 'Test Field'
        }).done(function(fid){new_fid=fid; done()});
      });
      it('should error on invalid field types', function(done){
        this.timeout(0);
        qbc.add_field({
          'dbid': table_dbid,
          'label': 'Test Field',
          'type': 'InvalidType'
        }).fail(function(){done()}).done(function(){done(new Error())});
      });
    });
    describe('#delete_field()', function(){
      it('should complete successfully', function(done){
        this.timeout(0);
        add_field_promise.done(function(){
          del_field_promise = qbc.delete_field({
            'dbid': table_dbid,
            'fid': new_fid
          }).done(function(){done()});
        });
      });
      it('should error on nonexistent fids', function(done){
        this.timeout(0);
        add_field_promise.done(function(){
          del_field_promise.done(function(){
            qbc.delete_field({
                'dbid': table_dbid,
                'fid': new_fid
              })
              .done(function(){done(new Error())})
              .fail(function(){done()});
          });
        });
      });
      it('should error on protected fids', function(done){
        this.timeout(0);
        qbc.delete_field({
          'dbid': table_dbid,
          'fid': 1
        }).done(function(){done(new Error())}).fail(function(){done()});
      });
    });
    describe('#set_key_field()',function(){
      it('should complete successfully',function(done){
        qbc.set_key_field({
          dbid: table2_dbid,
          fid: 6
        }).done(function(){
          qbc.set_key_field({
            dbid: table2_dbid,
            fid: 3
          }).done(function(){
            done();
          });
        });
      });
    });
    describe('#set_field_properties()',function(){
      it('should complete successfully',function(done){
        qbc.set_field_properties({
          dbid:table2_dbid,
          fid: 6,
          properties: {
            "unique": false
          }
        }).done(function(){
          done();
        });
      });
    });
    describe('#field_add_choices()',function(){
      var qbc = new QuickBaseClient({realm:'wmt',apptoken:apptoken});
      var promise = qbc.field_add_choices({
        dbid: table2_dbid,
        fid: 11,
        choices: ['New Choice 1','New Choice 2','New Choice 3']
      });
      it('should complete successfully',function(done){
        promise.done(function(){done()});
      });
      it('should return appropriate results',function(done){
        promise.done(function(data){
          expect(data).to.be.a('number');
          done();
        })
      });
    });
    describe('#field_remove_choices()',function(){
      var qbc = new QuickBaseClient({realm:'wmt',apptoken:apptoken});
      var promise = qbc.field_remove_choices({
        dbid: table2_dbid,
        fid: 11,
        choices: ['New Choice 1','New Choice 2','New Choice 3']
      });
      it('should complete successfully',function(done){
        promise.done(function(){done()});
      });
      it('should return appropriate results',function(done){
        promise.done(function(data){
          expect(data).to.be.a('number');
          done();
        })
      });
    });
  });
  describe('Record Operations', function(){
    var deferred = $.Deferred(), promise = deferred.promise(), rid;

    describe('#add_record()', function(){
      var qbc = new QuickBaseClient({realm:'wmt',apptoken:apptoken});
      it('should complete successfully', function(done){
        qbc.add_record({
          'dbid': table_dbid,
          'record': {
            '35': 'Test',
            '36': '1',
            '37': '01/02/1920',
            '38': '1',
            '39': ['56654836.d3kn','trcorp@wal-mart.com','jrustad'].join(';')
          }
        }).done(function(data){rid=data.rid; done(); deferred.resolve()});
      });
    });
    describe('#add_record_form()',function(){
      var qbc = new QuickBaseClient({realm:'wmt',apptoken:apptoken});
      var arf_promise = qbc.add_record_form({
        dbid: table2_dbid,
        defaults:{
          "6": "Test",
          "7": 42
        }
      });
      it('should complete successfully',function(done){
        arf_promise.done(function(){done()});
      });
      it('should return appropriate results',function(done){
        arf_promise.done(function(data){
          expect(data.length).to.be.above(100);
          expect(data).to.be.a('string');
          expect(data).to.include('Test');
          expect(data).to.include('42');
          done();
        })
      });
    });
    describe('#change_record_owner()',function(){
      var qbc = new QuickBaseClient({realm:'wmt',apptoken:apptoken});
      var cro_deferred = $.Deferred(), cro_promise=cro_deferred.promise();
      promise.done(function(){
        qbc.change_record_owner({
          dbid: table_dbid,
          rid: rid,
          user: 'jrustad'
        }).done(function(data){
          cro_deferred.resolve(data);
        });
      });
      it('should complete successfully',function(done){
        cro_promise.done(function(){
          done();
        })
      });
    });
    describe('#copy_master()',function(){
      it('should complete successfully');
      it('should return appropriate results');
    });
    describe('#copy_details()',function(){
      it('should complete successfully');
      it('should return appropriate results');
    });
    describe('#delete_record()',function(){
      var qbc = new QuickBaseClient({realm:'wmt',apptoken:apptoken});
      it('should complete successfully',function(done){
        promise.done(function(){
          qbc.delete_record({'dbid':table_dbid,'rid':rid}).done(function(){done()});
        })
      });
      it('should error on nonexistent records',function(done){
        qbc.delete_record({'dbid':table_dbid,'rid':1}).done(function(){done(new Error())}).fail(function(){done()});
      });
    });
    describe('#edit_record()',function(){
      it('should complete successfully');
      it('should error on nonexistent records');
      it('should error on protected fids');
    });
    describe('#query()',function(){
      it('should complete successfully');
      it('should return appropriate results');
    });
    describe('#query_count()',function(){
      it('should complete successfully');
      it('should return appropriate results');
    });
    describe('#gen_results_table()',function(){
      it('should complete successfully');
      it('should return appropriate results');
    });
    describe('#record_as_html()',function(){
      it('should complete successfully');
      it('should return appropriate results');
    });
    describe('#record_info()',function(){
      it('should complete successfully');
      it('should return appropriate results');
    });
  });
  describe('Table Operations',function(){
    var qbc = new QuickBaseClient({realm:'wmt',apptoken:apptoken});

    describe('#num_records()',function(){
      it('should complete successfully');
      it('should return appropriate results');
    });
    describe('#purge()',function(){
      it('should complete successfully',function(done){
        qbc.purge({dbid: table2_dbid}).done(function(){done();});
      });
      it('should return appropriate results');
    });
  });
  describe('User Operations',function(){
    describe('#add_user_to_role()',function(){
      it('should complete successfully');
      it('should return appropriate results');
    });
    describe('#change_user_role()',function(){
      it('should complete successfully');
      it('should return appropriate results');
    });
    describe('#role_info()',function(){
      it('should complete successfully');
      it('should return appropriate results');
    });
    describe('#user_info()',function(){
      it('should complete successfully');
      it('should return appropriate results');
    });
    describe('#provision_user()',function(){
      it('should complete successfully');
      it('should return appropriate results');
    });
    describe('#remove_user()',function(){
      it('should complete successfully');
      it('should return appropriate results');
    });
    describe('#invite()',function(){
      it('should complete successfully');
      it('should return appropriate results');
    });
  });
});
