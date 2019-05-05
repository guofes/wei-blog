App = {
	web3Provider: null,
	contracts: {},
	login: null,

	init: async function(){
		var loc = location.href;
  		var n1 = loc.length;//地址的总长度
  		var n2 = loc.indexOf("=");//取得=号的位置
  		if(n2 != -1)
  			login = loc.substr(n2+1, n1-n2);//从=号后面的内容
  		else
  			login = "false";
  		if(login == "true")
  		{
  			$('#title').text('登录');
  			$('#hasAccount').attr("href",'index.html').text('没有账户');
  		}
		return await App.initWeb3();
	},

	initWeb3: async function(){
		if (window.ethereum) {
			App.web3Provider = window.ethereum;
			try{
				await window.ethereum.enable();
			}catch(error){
				console.error("User denied account access");
			}
		}
		else if (window.web3) {
			App.web3Provider = window.web3.currentProvider;
		}
		else{
			App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
		}
		web3 = new Web3(App.web3Provider);

		return App.initContract();
	},

	initContract: function(){
		$.getJSON('MyBlog.json', function(data){
			var MyBlogArtifact = data;
			App.contracts.MyBlog = TruffleContract(MyBlogArtifact);
			App.contracts.MyBlog.setProvider(App.web3Provider);
			return;
		});
		return App.bindEvents();
	},

	bindEvents: function(){
		//to be continue
		$(document).on('click', '#submit', App.submitClick);
	},

	submitClick: function(event){
		event.preventDefault();
		
		var name = $('#nameinput').val();
		console.log(name);
		
		var MyBlogInstance;

		web3.eth.getAccounts(function(error, accounts){
			if(error){
				console.log(error);
			}

			var account = accounts[0];
			if(login == "false")
			{
				App.contracts.MyBlog.deployed().then(function(instance){
					MyBlogInstance = instance;
					return MyBlogInstance.register(name, {from: account});
				}).then(function(result){
					console.log("as");
					return App.deployAccount(name);
				}).catch(function(err){
					console.log(err.message);
				});
			}
			else
			{
				App.contracts.MyBlog.deployed().then(function(instance){
					MyBlogInstance = instance;

					return MyBlogInstance.getAddByName.call(name);
				}).then(function(address){
					if(address === '0x0000000000000000000000000000000000000000')
					{
						alert('用户名没注册');
						
					}
					else
					{
						web3.eth.getAccounts(function(error, accounts){
							if(error){
								console.log(error);
							}

							var account = accounts[0];
							if(account != address)
							{
								alert('用户不属于当前账户');
							}
							else
							{
								window.location.href = 'tmnt.html?'+"name="+encodeURI(name);
								return;
							}
						});
					}
				});
			}
			
		});
		
	},

	deployAccount: function(name){
		var MyBlogInstance;
		var Account;
		var AccountInstance;
		var add;

		web3.eth.getAccounts(function(error, accounts){
			if(error){
				console.log(error);
			}

			var account = accounts[0];
			var AccountABI;
			var bytecode;
			$.getJSON('Account.json', function(data){
				AccountABI = data.abi;
				bytecode = data.bytecode;
				console.log(AccountABI);
				console.log(bytecode);
				var AccountContract = web3.eth.contract(AccountABI);
				console.log(AccountContract);
				var ContractInstance = AccountContract.new({
				    data: bytecode,
				    from: account,
				    gas: 1216003
				},function (e, contract){
				    console.log(e, contract);
				    if (typeof contract.address !== 'undefined') {
				         console.log('Contract mined! address: ' + contract.address + ' transactionHash: ' + contract.transactionHash);

				        App.contracts.MyBlog.deployed().then(function(instance){
							MyBlogInstance = instance;
							console.log(contract.address);
							return MyBlogInstance.setDeployedAdd(name, contract.address, {from: account});
						}).then(function(result){
							

							window.location.href = 'tmnt.html?'+"name="+encodeURI(name);
							return;
						}).catch(function(err){
							console.log(err.message);
						});
				    }
				}
				);

				console.log(ContractInstance);
				return;
			});
		});
	}


};

$(function() {
  $(window).load(function() {
    App.init();
  });
});