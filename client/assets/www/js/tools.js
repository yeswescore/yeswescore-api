tpl = {
  // Hash of preloaded templates for the app
  templates:{},

  // Recursively pre-load all the templates for the app.
  // This implementation should be changed in a production environment.
  // All the template files should be concatenated in a single file.
  loadTemplates:function (names, callback) {
	  
	
    var that = this;

    var loadTemplate = function (index) {
      var name = names[index];
      
      
      //$.get('templates/' + name + '.html', function (data) {
      // that.templates[name] = data;
      //On centralise tout sur index.html
      that.templates[name] = $('#'+name).html();
      
        index++;
        if (index < names.length) {
          loadTemplate(index);
        } else {
          callback();
        }
      //});
      
      //console.log('Loading template: ' + name);
    }

    loadTemplate(0);
    
  },

  // Get template by name from hash of preloaded templates
  get:function (name) {
    return this.templates[name];
	//console.log('get ',$('#'+name).html());
    //return $('#'+name).html();
  }
};
