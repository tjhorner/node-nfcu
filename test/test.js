var NavyFederal = require('../lib/nfcu'),
    config = require('./test-config'),
    nfcu = new NavyFederal(),
    should = require('should');

describe("NavyFederal", function(){
  var testUser, testAccount;

  describe("#login(username, password)", function(){
    this.slow(5000);

    it("should fail when invalid credentials are provided", function(done){
      nfcu.login("lameuser", "lamepassword", function(data){
        should.equal(data.loginv2.status, "FAILED");
        done();
      });
    });

    it("should be successful when valid credentials are provided", function(done){
      nfcu.login(config.username, config.password, function(data){
        should.exist(data);
        testUser = data;
        done();
      });
    });
  });

  describe("#getMemberSummary()", function(){
    this.slow(3000);
    
    it("should get a summary of the logged-in NFCU member", function(done){
      nfcu.getMemberSummary(function(data){
        should.exist(data);
        should.exist(data.firstName);
        done();
      });
    });
  });

  describe("#getAccountSummary()", function(){
    this.slow(3000);

    it("should get a summary of the logged-in user's accounts", function(done){
      nfcu.getAccountSummary(function(data, res){
        should.exist(data);
        testAccount = data.accounts[0];
        done();
      });
    });
  });

  describe("#getAccountDetails(accountId)", function(){
    this.slow(3000);

    it("should fail when an invalid account ID is provided", function(done){
      nfcu.getAccountDetails("fake_account_id", function(data){
        should.equal(data.accountDetails.status, "FAILED");
        done();
      });
    });

    it("should get more detailed information about the specified account ID", function(done){
      nfcu.getAccountDetails(testAccount.accountId, function(data){
        should.exist(data);
        should.equal(data.accountId, testAccount.accountId);
        done();
      });
    });
  });
});
