function admin(){
    code = prompt("Code?");
	const login = process.env.ifyouarelookingatthisitwillnotwork;
	module.exports = {
	   login: login
	}
	
	console.log(login);
	if (code===login){
		alert('Redirecting...')
		window.location.href = 'https://robby.ml/admin.html'
	}else{
		alert('Invalid code!');
	}
}