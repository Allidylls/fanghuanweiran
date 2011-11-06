// class of users
WeApp.User = Weiran.Class(WeApp, {

    initialize: function (options) {
        WeApp.prototype.initialize.apply(this, arguments);
    },

    run: function () {
        WeApp.prototype.run.apply(this, arguments);
        this.getTheWindow().setState('maximized');
    },
    
    destroy: function () {
        WeApp.prototype.destroy.apply(this, arguments);
    },

    CLASS_NAME: "WeApp.User"
});

// this application
var app = null;
// create and run after loading
jQuery(window).load(function() {
    app = new WeApp.User();
    app.run();
});
// stop and clear after leaving
jQuery(window).unload(function() {
    app.destroy();
    app = null;
});

/*
Weiran.Applet.User = Weiran.Class(Weiran.Applet, {
    // true represents the socket processing signing in
    processing: false,
    
    // true if there is a user signed in
    online: false,
    
    // HTML content for signing out
    contentSignOut: null,
    
    // HTML content for registering
    contentRegister: null,
    
    // web socket
    socket: null,

    initialize: function (options) {
        Weiran.Applet.prototype.initialize.apply(this, arguments);
        this.title = Weiran.i18n('User_title');
        this.content = "<div class='weAppletUserSignIn'>" +
            "<p><label>登录名称：</label><input data-wid='username' type='text' /></p>" + 
            "<p><label>登录密码：</label><input data-wid='password' type='password' /></p>" +
            "<p><button data-wid='register'>注册用户</button> <button data-wid='findpswd'>找回密码</button> " +
                "<button data-wid='signin'>登录系统</button></p>" +
            "<div>" +
            "<hr /><div data-wid='info' class='weAppletUserFeedback'></div>";
            
        this.contentSignOut = "<div class='weAppletUserSignOut'>" +
            "<p>登出系统将撤销所有与用户有关的功能</p>"+
            "<p><button data-wid='signout'>确定并登出系统</button></p>" +
            "</div>";
        
        this.contentRegister = "<div class='weAppletUserRegister'><table style='margin:0 auto;'>" +
                "<tr><td>登录名称：</td><td><input data-wid='username' type='text' /></td></tr>" +
                "<tr><td>登录密码：</td><td><input data-wid='password1' type='password' /></td></tr>" +
                "<tr><td>重复密码：</td><td><input data-wid='password2' type='password' /></td></tr>" +
            "</table><p><button data-wid='register'>确定并提交注册信息</button></p>" +
            "<hr /><div data-wid='info' class='weAppletUserFeedback'></div></div>";
    },

    destroy: function () {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        Weiran.Applet.prototype.destroy.apply(this, arguments);
    },
    
    onCreate: function (evt) {
        var wm = Weiran.theApp.getManager();
        if (this.active) {
            this.window.select();
        } else {
            // create a new window here
            if (this.online) {
                // sign out window
                this.window = wm.createWindow({
                    title: this.title,
                    width: 360,
                    height: 150,
                    centered: true,
                    alwaysOnTop: true
                });
                this.window.setContent(this.contentSignOut);
                this.active = true;
                this.window.onclose = this.onClose(this);
                this.skipMapEvents();
                // add event handlers to this window
                $(this.window.getElement('signout')).click({'applet': this}, this.onSignOut);
            } else {
                // sign in window
                this.window = wm.createWindow({
                    title: this.title,
                    width: 360,
                    height: 240,
                    centered: true,
                    alwaysOnTop: true
                });
                this.window.setContent(this.content);
                this.active = true;
                this.window.onclose = this.onClose(this);
                this.skipMapEvents();
                // add event handlers to this window
                $(this.window.getElement('signin')).click({'applet': this}, this.onSignIn);
                $(this.window.getComponent('content')).find('input').keydown({'applet': this}, this.onKeyDown);
                $(this.window.getElement('findpswd')).click({'applet': this}, this.onFindPswd);
                $(this.window.getElement('register')).click({'applet': this}, this.onRegister);
                // load cookies data
                this.window.getElement('username').value = $.cookies.get($.md5('username'));
                this.window.getElement('password').value = $.cookies.get($.md5('password'));
            }
        }
        Weiran.Applet.prototype.onCreate.apply(this, arguments);
    },
    
    onClose: function (applet) { return function () {
        applet.active = false;
        applet.window = null;
        applet.processing = false;
        if (applet.socket) {
            applet.socket.disconnect();
            applet.socket = null;
        }
    };},
    
    onKeyDown: function (evt) {
        // enter event triggers click event
        if (evt.keyCode == '13') {
            $(evt.data.applet.window.getElement('signin')).click();
            // stop event
            evt.preventDefault();
        }
    },
    
    onSignIn: function (evt) {
        // note, 'this' is the dom now
        // the applet is in evt.data.applet
        // identify the user
        if (evt.data.applet.processing) return;
        
        var username = evt.data.applet.window.getElement('username').value,
            password = evt.data.applet.window.getElement('password').value;
        // create a socket to sign in
        evt.data.applet.socket = io.connect(Weiran.theApp.userDataHost, {
            'force new connection': true, // should be true
            'reconnect': false // should not atuo-reconnect
        });
        evt.data.applet.window.getElement('info').innerHTML = '正在连接服务器...';
        evt.data.applet.processing = true;
        evt.data.applet.socket.on('connect', function () {
            evt.data.applet.window.getElement('info').innerHTML = '连接成功，验证中...';
            evt.data.applet.processing = true;
            evt.data.applet.socket.emit('signin', username, $.md5(password));
        });
        evt.data.applet.socket.on('disconnect', function () {
            evt.data.applet.processing = false;
            evt.data.applet.socket.disconnect();
            evt.data.applet.socket = null;
        });
        evt.data.applet.socket.on('error', function (err) {
            evt.data.applet.processing = false;
            evt.data.applet.window.getElement('info').innerHTML = err;
            if (evt.data.applet.socket) {
                evt.data.applet.socket.disconnect();
                evt.data.applet.socket = null;
            }
        });
        evt.data.applet.socket.on('access', function (user) {
            // user object is the data of user settings saved on server
            evt.data.applet.window.getElement('info').innerHTML = '验证成功，准备登入系统...';
            evt.data.applet.socket.disconnect();
            evt.data.applet.socket = null;
            // ok, update cookies
            $.cookies.set($.md5('username'), username, {expiresAt: new Date(2012,12,31)});
            $.cookies.set($.md5('password'), password, {expiresAt: new Date(2012,12,31)});
            // tell the app
            Weiran.theApp.events.triggerEvent('userlogin', {'user': user});
            // update applet status
            evt.data.applet.processing = false;
            evt.data.applet.online = true;
            evt.data.applet.window.close();
        });
    },
    
    onSignOut: function (evt) {
        // note, 'this' is the dom now
        // the applet is in evt.data.applet
        // tell the app
        Weiran.theApp.events.triggerEvent('userlogout');
        evt.data.applet.online = false;
        evt.data.applet.window.close();
    },
    
    onFindPswd: function(evt) {
        // note, 'this' is the dom now
        // the applet is in evt.data.applet
        alert('请联系管理员');
    },
    
    onRegister: function(evt) {
        // note, 'this' is the dom now
        // the applet is in evt.data.applet
        if (evt.data.applet.processing) return;
        // change content
        evt.data.applet.window.setTitle('注册用户');
        evt.data.applet.window.setContent(evt.data.applet.contentRegister);
        evt.data.applet.active = true;
        evt.data.applet.window.onclose = evt.data.applet.onClose(evt.data.applet);
        // add event handlers to this window
        $(evt.data.applet.window.getElement('register')).click({'applet': evt.data.applet}, evt.data.applet.onCreateUser);
        $(evt.data.applet.window.getComponent('content')).find('input').keydown({'applet': evt.data.applet}, evt.data.applet.onKeyDownRegister);
    },
    
    onCreateUser: function(evt) {
        // note, 'this' is the dom now
        // the applet is in evt.data.applet
        if (evt.data.applet.processing) return;
        
        var user = OpenLayers.String.trim(evt.data.applet.window.getElement('username').value),
            psw1 = OpenLayers.String.trim(evt.data.applet.window.getElement('password1').value),
            psw2 = OpenLayers.String.trim(evt.data.applet.window.getElement('password2').value);
        if (user.length<5 || user.length>30) {
            evt.data.applet.window.getElement('info').innerHTML = '登录名称必须由5到30个字符组成，请重新输入';
            return;
        }
        if (psw1.length<5 || psw1.length>30) {
            evt.data.applet.window.getElement('info').innerHTML = '登录密码必须由5到30个字符组成，请重新输入';
            return;
        }
        if (psw1 !== psw2) {
            evt.data.applet.window.getElement('info').innerHTML = '两次登录密码不一样，请重新输入';
            return;
        }
        
        // ok, create a new user
        evt.data.applet.window.getElement('info').innerHTML = '新用户创建中...';
        evt.data.applet.createUser(user, psw1);
    },
    
    createUser: function(user, pswd) {
        if (this.processing) return;
        
        // create a socket
        this.socket = io.connect(Weiran.theApp.userDataHost, {
            'force new connection': true, // should be true
            'reconnect': false // should not atuo-reconnect
        });
        this.window.getElement('info').innerHTML = '正在连接服务器...';
        this.processing = true;
        this.socket.on('connect', (function (app) { return function() {
            app.window.getElement('info').innerHTML = '连接成功，注册中...';
            app.processing = true;
            app.socket.emit('register', user, $.md5(pswd));
        }})(this));
        this.socket.on('disconnect', (function (app) { return function() {
            app.processing = false;
            app.socket.disconnect();
            app.socket = null;
        }})(this));
        this.socket.on('error', (function (app) { return function(err) {
            app.processing = false;
            app.window.getElement('info').innerHTML = err;
            if (app.socket) {
                app.socket.disconnect();
                app.socket = null;
            }
        }})(this));
        this.socket.on('access', (function (app) { return function(userobj) {
            // user object is the data of user settings saved on server
            app.window.getElement('info').innerHTML = '注册成功，准备登入系统...';
            app.socket.disconnect();
            app.socket = null;
            // ok, update cookies
            $.cookies.set($.md5('username'), user, {expiresAt: new Date(2012,12,31)});
            $.cookies.set($.md5('password'), pswd, {expiresAt: new Date(2012,12,31)});
            // tell the app
            Weiran.theApp.events.triggerEvent('userlogin', {'user': userobj});
            // update applet status
            app.processing = false;
            app.online = true;
            app.window.close();
        }})(this));
    },
    
    onKeyDownRegister: function(evt) {
        // enter event triggers click event
        if (evt.keyCode == '13') {
            $(evt.data.applet.window.getElement('register')).click();
            // stop event
            evt.preventDefault();
        }
    },

    CLASS_NAME: "Weiran.Applet.User"
});
*/
