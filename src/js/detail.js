Detail = {
	web3Provider: null,
	contracts: {},
	name,

	init: async function(){
		var loc = location.href;
  		var n1 = loc.length;//地址的总长度
  		var n2 = loc.indexOf("=");//取得=号的位置
  		name = decodeURI(loc.substr(n2+1, n1-n2));//从=号后面的内容
  		$('#user_name').html(name);
		return await Detail.initWeb3();
	},

	initWeb3: async function(){
		if (window.ethereum) {
			Detail.web3Provider = window.ethereum;
			try{
				await window.ethereum.enable();
			}catch(error){
				console.error("User denied account access");
			}
		}
		else if (window.web3) {
			Detail.web3Provider = window.web3.currentProvider;
		}
		else{
			Detail.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
		}
		web3 = new Web3(Detail.web3Provider);

		return Detail.initContract();
	},

	initContract: function(){
		$.getJSON('MyBlog.json', function(data){
			var MyBlogArtifact = data;
			Detail.contracts.MyBlog = TruffleContract(MyBlogArtifact);
			Detail.contracts.MyBlog.setProvider(Detail.web3Provider);
			return;
		}).then(function(result){
			var MyBlogInstance;
			Detail.contracts.MyBlog.deployed().then(function(instance){
				MyBlogInstance = instance;

				return instance.getDeployedAdd.call(name);
			}).then(function(deployedAdd){
				return Detail.getAccountAdd(deployedAdd);
			}).then(function(result){

				Detail.contracts.MyBlog.deployed().then(function(instance){
					MyBlogInstance = instance;

					return MyBlogInstance.getAddByName.call(name);
				}).then(function(address){
					if(address === '0x0000000000000000000000000000000000000000')
					{
						alert('用户名没注册');
						return;
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
								$('#user_content').hide();
								$('#addBtn').hide();
								$('#private').hide();
								$('#randomBlogBtn').hide();
								$('#targetBlogBtn').hide();

								Detail.contracts.MyBlog.deployed().then(function(instance){
									MyBlogInstance = instance;
									return MyBlogInstance.getNameByAdd.call(account);
								}).then(function(resultName){
									return MyBlogInstance.getDeployedAdd.call(resultName);
								}).then(function(resultAdd){
									var AccountABI;
									$.getJSON('Account.json', function(data){
										AccountABI = data.abi;
										var MyAccountInstance = web3.eth.contract(AccountABI).at(resultAdd);
										MyAccountInstance.isFollow.call(name, function(error,result){

											if(result)
											{
												$('#followBtn').text('取消关注');
											}
										});
									});
								});


								return Detail.showMyBlogs();
							}
							else
							{

								$('#followBtn').hide();
								return Detail.showMyBlogs();
							}
						});
					}
				});


				
			}).catch(function(err){
				console.log(err.message);
			});
		});

		

		return Detail.bindEvents();
	},

	getAccountAdd: function(deployedAdd){
		var AccountABI;
		$.getJSON('Account.json', function(data){
			AccountABI = data.abi;
			Detail.contracts.MyAccount = web3.eth.contract(AccountABI).at(deployedAdd);
			console.log(Detail.contracts.MyAccount);
		});

		
		return;
	},


	showMyBlogs: function(){
		web3.eth.getAccounts(function(error, accounts){
			var account = accounts[0];
			var blogNum;

			Detail.contracts.MyAccount.getBlogNum.call({from: account},function(err, result){


				blogNum = result.c[0];
				console.log(blogNum);
				web3.eth.getAccounts(function(error, accounts){
					var account = accounts[0];

					for(var i = 0; i < blogNum; i++)
					{
						(function(i){

							
							Detail.contracts.MyAccount.getBlog(i,{from: account}, function(err, result){
								console.log(result);

								var context = result[0];
								var publishTime = result[1].c[0];
								var likeNum = result[2].c[0];
								var dislikeNum = result[3].c[0];
								if(!Detail.isDeleteBlog(context))
								{
									var date = new Date(publishTime * 1000);

									var np = $('<p class="users"></p>').text(name);
									var p = $('<p class="words"></p>').text(context);
									var del = $('<span class="del"></span>').text('删除' + ' id:' + i);
									var ptime = $('<p class="words time "></p>').text(date.toLocaleString());
									var content = $('<div class="content "></div>');
									var hr = $('<hr>');
									var li = $('<li></li>');
									
									ptime.append(del);
									content.append(p).append(ptime);
									li.append(np).append(content).append(hr);

									$('#out_content').append(li);

									del.click(Detail.delFun);
								}

								
							});

						})(i);
						
					}
				});


			});
		});

	},

	isDeleteBlog: function(context){
		return (context == "@deleteBlog");
	},

	delFun: function(){
		var index = $(this).text().indexOf(':');
		var id = $(this).text().substr(index + 1);
		console.log(id);
		$(this).parent().parent().parent().remove();
		Detail.contracts.MyAccount.deleteBlog(id, function(result){
			
		});
	},


	bindEvents: function(){
		//to be continue
		$(document).on('click', '#addBtn', Detail.submitClick);
		$(document).on('click', '#searchP', Detail.searchClick);
		$(document).on('click', '#backBtn', Detail.backClick);
		$(document).on('click', '#logOutBtn', Detail.logOutClick);
		$(document).on('click', '#randomBlogBtn', Detail.randomBlogBtnClick);
		$(document).on('click', '#myBlogBtn', Detail.myBlogBtnClick);
		$(document).on('click', '#targetBlogBtn', Detail.targetBlogBtnClick);
		$(document).on('click', '#followBtn', Detail.followBtnClick);

		

	},

	targetBlogBtnClick: function(event){
		$('#out_content').empty();
		var t = new Array();
		for(var i = 0; i < 10; i++)
		{

			Detail.contracts.MyAccount.getRandomTargetName.call(Math.floor(Math.random()*100), function(err, result){
				web3.eth.getAccounts(function(error, accounts){
					var account = accounts[0];
					if(t.indexOf(result) == -1)
					{
						t.push(result);
						Detail.contracts.MyBlog.deployed().then(function(instance){
							var MyBlogInstance = instance;
							return MyBlogInstance.getDeployedAdd.call(result);
						}).then(function(address){
							return Detail.showLatestBlogs(address, account, result);
						});
					}
				});
			});
		}
		
	},

	followBtnClick: function(event){
		var MyBlogInstance;
		
		web3.eth.getAccounts(function(error, accounts){
			var account = accounts[0];
			Detail.contracts.MyBlog.deployed().then(function(instance){
				MyBlogInstance = instance;
				return MyBlogInstance.getNameByAdd.call(account);
			}).then(function(resultName){
				return MyBlogInstance.getDeployedAdd.call(resultName);
			}).then(function(resultAdd){
				var AccountABI;
				$.getJSON('Account.json', function(data){
					AccountABI = data.abi;
					var MyAccountInstance = web3.eth.contract(AccountABI).at(resultAdd);

					MyAccountInstance.isFollow.call(name, function(error,result){
						console.log(result);
						if(!result)
						{
							MyAccountInstance.follow(name, {form: account}, function(err){
								$('#followBtn').text('取消关注');
							});
						}
						else
						{
							MyAccountInstance.nofollow(name, {from: account}, function(err){
								$('#followBtn').text('关注');
							});
						}
					});
						
				});
			});
		});
		
	},

	myBlogBtnClick: function(event){
		$('#out_content').empty();
		return Detail.showMyBlogs();
	},

	randomBlogBtnClick: function(event){
		$('#out_content').empty();
		for(i = 0; i < 10; i++)
		{
			Detail.randomGetAdd(i);
		}
	},

	randomGetAdd: function(i)
	{
		console.log(i);
		Detail.contracts.MyBlog.deployed().then(function(instance){
			var MyBlogInstance = instance;
			return MyBlogInstance.randomGetName.call(i);
		}).then(function(resultName){
			web3.eth.getAccounts(function(error, accounts){
				var account = accounts[0];
				console.log(resultName);
				Detail.contracts.MyBlog.deployed().then(function(instance){
					var MyBlogInstance = instance;

					return MyBlogInstance.getDeployedAdd.call(resultName);
				}).then(function(address){
					return Detail.showBlogs(address, account, resultName);
				});
			});
		});
	},

	showLatestBlogs: function(address, account, resultName){
		var AccountABI;
		var accountInstance;
		$.getJSON('Account.json', function(data){
			AccountABI = data.abi;
			accountInstance = web3.eth.contract(AccountABI).at(address);
		}).then(function(){	
			accountInstance.getBlogNum.call({from: account},function(err, result){

				var blogNum = result.c[0];
				console.log(blogNum);
				if(blogNum >= 1)
				{
					accountInstance.getBlog(blogNum - 1,{from: account}, function(err, result){
						return Detail.appendBlog(result,resultName);
					});
				}
				if(blogNum >= 2)
				{
					accountInstance.getBlog(blogNum - 2,{from: account}, function(err, result){
						return Detail.appendBlog(result, resultName);
					});
				}
				
			});
		});
	},

	appendBlog: function(result, resultName)
	{
		if(result == null)
			return;	

		var context = result[0];
		var publishTime = result[1].c[0];
		var likeNum = result[2].c[0];
		var dislikeNum = result[3].c[0];

		
		if(!Detail.isDeleteBlog(context))
		{
			var date = new Date(publishTime * 1000);

			var np = $('<p class="users"></p>').text(resultName);
			var p = $('<p class="words"></p>').text(context);

			var ptime = $('<p class="words time "></p>').text(date.toLocaleString());
			var content = $('<div class="content "></div>');
			var hr = $('<hr>');
			var li = $('<li></li>');
			

			content.append(p).append(ptime);
			li.append(np).append(content).append(hr);

			$('#out_content').append(li);

			li.click(Detail.retranFun);
		}

		
	},

	retranFun: function(){
		var index = $("ul li").index(this);
	    
	    var myDate = new Date();
		var date = myDate.toLocaleString();
		var text = $(this).find('.words').not('.time').text();
		var author = $(this).find('.users').text();
		var pos = text.indexOf('--转载自:');
		if(pos == -1)
			text = text + "   --转载自:" + author;
		
		
		
		web3.eth.getAccounts(function(error, accounts){
			var account = accounts[0];

			return Detail.contracts.MyAccount.publish(text,false, {from:account},function(err,result){
				if(!error)
			       console.log(JSON.stringify(result));
			   	else
			       console.error(error);
			   	$('#out_content').empty();
			   	return Detail.showMyBlogs();
			});
		});
		
	},

	showBlogs: function(address, account, resultName){
		var AccountABI;
		var accountInstance;
		$.getJSON('Account.json', function(data){
			AccountABI = data.abi;
			accountInstance = web3.eth.contract(AccountABI).at(address);
		}).then(function(){	
			accountInstance.getBlogNum.call({from: account},function(err, result){

				var blogNum = result.c[0];
				var ran =  Math.floor(Math.random()*blogNum);
				accountInstance.getBlog(ran,{from: account}, function(err, result){
					return Detail.appendBlog(result, resultName);
				});
			});
		});
	},

	logOutClick: function(event){
		window.location.href = 'index.html';
	},

	backClick: function(event){
		web3.eth.getAccounts(function(error, accounts){
			var account = accounts[0];
			Detail.contracts.MyBlog.deployed().then(function(instance){
				MyBlogInstance = instance;
				return MyBlogInstance.getNameByAdd.call(account);
			}).then(function(resultName){
				window.location.href = 'tmnt.html?'+"name="+encodeURI(resultName);
			});
		});
		
		
	},

	submitClick: function(event){
		var myDate = new Date();
		var date = myDate.toLocaleString();
		var text = $('#user_content').val();
		if(text.length != 0)
		{
			Detail.contracts.MyAccount.getBlogNum.call(function(err, result){

				var np = $('<p class="users"></p>').text(name);
				var p = $('<p class="words"></p>').text(text);
				var del = $('<span class="del"></span>').text('删除 id: ' + result);
				var ptime = $('<p class="words time "></p>').text(date);
				var content = $('<div class="content "></div>');
				var hr = $('<hr>');
				var li = $('<li></li>');
				
				ptime.append(del);
				content.append(p).append(ptime);
				li.append(np).append(content).append(hr);

				$('#out_content').append(li);

				li.click(Detail.retranFun);

				web3.eth.getAccounts(function(error, accounts){
					var account = accounts[0];
					var pri = $('#privateC').prop('checked');
					console.log(pri);

					return Detail.contracts.MyAccount.publish(text,pri, {from:account},function(err,result){
						if(!error)
					       console.log(JSON.stringify(result));
					   	else
					       console.error(error);
					});
				});


			});

		}
		
		
	},

	searchClick: function(event){
		var name = $('#searchinput').val();

		var MyBlogInstance;
		Detail.contracts.MyBlog.deployed().then(function(instance){
			MyBlogInstance = instance;
			return MyBlogInstance.getAddByName.call(name);
		}).then(function(address){
			if(address === '0x0000000000000000000000000000000000000000')
			{
				alert('用户名没注册');
				return;
			}
			else
			{
				window.location.href = 'tmnt.html?'+"name="+encodeURI(name);
			}
		});

	}

	

};

$(function() {
  $(window).load(function() {
    Detail.init();
  });
});