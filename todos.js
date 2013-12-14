/** @jsx React.DOM */

// Todo Model
// ----------

// Our basic **Todo** model has `title` and `done` attributes.
var Todo = Backbone.Model.extend({

  // Default attributes for the todo item.
  defaults: function() {
    return {
      title: "empty todo...",
      done: false
    };
  }

});

// Todo Collection
// ---------------

// The collection of todos is backed by *localStorage* instead of a remote
// server.
var TodoList = Backbone.Collection.extend({

  // Reference to this collection's model.
  model: Todo,

  // Save all of the todo items under the `"todos-backbone"` namespace.
  localStorage: new Backbone.LocalStorage("todos-backbone"),

  // Filter down the list of all todo items that are finished.
  done: function() {
    return this.where({done: true});
  },

  // Filter down the list to only todo items that are still not finished.
  remaining: function() {
    return this.where({done: false});
  }

});

var BackboneMixin = {
  componentDidMount: function() {
    this._boundForceUpdate = this.forceUpdate.bind(this, null);
    this.getBackboneObject().on("all", this._boundForceUpdate, this);
  },
  componentWillUnmount: function() {
    this.getBackboneObject().off("all", this._boundForceUpdate);
  },
  getBackboneObject: function() {
    return this.props.collection || this.props.model;
  }
};

var TodoListItemComponent = React.createClass({
  componentDidUpdate: function() {
    if (this.state.editing) {
      this.refs.editInput.getDOMNode().focus();
    }
  },
  destroy: function() {
    this.props.model.destroy();
  },
  getInitialState: function() {
    return {
      editing: false
    };
  },
  handleEditKeyPress: function(event) {
    if (13 === event.keyCode) {
      this.stopEditing();
    }
  },
  render: function() {
    var inputStyles = {};
    var viewStyles = {};

    if (this.state.editing) {
      viewStyles.display = "none";
    } else {
      inputStyles.display = "none";
    }

    return (
      <li className={this.props.model.get("done") ? "done" : ""}>
        <div className="view" onDoubleClick={this.startEditing} style={viewStyles}>
          <input className="toggle" type="checkbox"
            checked={this.props.model.get("done")}
            onChange={this.toggleDone} />
          <label>{this.props.model.get("title")}</label>
          <a className="destroy" onClick={this.destroy}></a>
        </div>
        <input className="edit" ref="editInput" type="text"
          onBlur={this.stopEditing}
          onChange={this.setTitle}
          onKeyPress={this.handleEditKeyPress}
          style={inputStyles}
          value={this.props.model.get("title")} />
      </li>
    );
  },
  setTitle: function(event) {
    this.props.model.set("title", event.target.value);
  },
  startEditing: function() {
    this.setState({editing: true});
  },
  stopEditing: function() {
    this.setState({editing: false});
  },
  toggleDone: function(event) {
    this.props.model.set("done", $(event.target).is(":checked"));
  }
});

var TodoListComponent = React.createClass({
  render: function() {
    var todoListItems = this.props.collection.map(function(model) {
      return <TodoListItemComponent key={model.id} model={model} />
    });

    return (
      <ul id="todo-list">
        {todoListItems}
      </ul>
    );
  }
});

var FooterComponent = React.createClass({
  render: function() {
    var footerStyles = {};
    if (0 === this.props.itemsDoneCount && 0 === this.props.itemsRemainingCount) {
      footerStyles.display = "none";
    }

    var clearCompletedStyles = {};
    if (0 === this.props.itemsDoneCount) {
      clearCompletedStyles.display = "none";
    }

    return (
      <footer style={footerStyles}>
        <a id="clear-completed" style={clearCompletedStyles}
            onClick={this.props.clearCompletedItems}>
          Clear {this.props.itemsDoneCount} completed
          {1 === this.props.itemsDoneCount ? " item" : " items"}
        </a>
        <div className="todo-count">
          <b>{this.props.itemsRemainingCount}</b>
          {1 === this.props.itemsRemainingCount ? " item" : " items"} left
        </div>
      </footer>
    );
  }
});

var MainComponent = React.createClass({
  toggleAllItemsCompleted: function(event) {
    this.props.toggleAllItemsCompleted(event.target.checked);
  },
  render: function() {
    var toggleAllStyles = {};
    if (0 === this.props.collection.length) {
      toggleAllStyles.display = "none";
    }

    return (
      <section id="main">
        <input id="toggle-all" type="checkbox" style={toggleAllStyles}
          checked={0 === this.props.collection.remaining().length}
          onChange={this.toggleAllItemsCompleted} />
        <label htmlFor="toggle-all" style={toggleAllStyles}>
          Mark all as complete
        </label>
        <TodoListComponent collection={this.props.collection} />
        <FooterComponent
          clearCompletedItems={this.props.clearCompletedItems}
          itemsRemainingCount={this.props.collection.remaining().length}
          itemsDoneCount={this.props.collection.done().length} />
      </section>
    );
  }
});

var AppComponent = React.createClass({
  clearCompletedItems: function() {
    _.invoke(this.props.collection.done(), "destroy");
  },
  componentWillMount: function() {
    this.props.collection.fetch();
  },
  handleKeyPress: function(event) {
    if (13 !== event.keyCode) return;

    var $input = $(event.target);
    if (!$input.val()) return;

    this.props.collection.create({title: $input.val()});
    $input.val("");
  },
  toggleAllItemsCompleted: function(completed) {
    this.props.collection.each(function(todo) {
      todo.save({"done": completed});
    });
  },
  mixins: [BackboneMixin],
  render: function() {
    return (
      <div>
        <header>
          <h1>Todos</h1>
          <input placeholder="What needs to be done?" type="text"
            onKeyPress={this.handleKeyPress} />
        </header>
        <MainComponent
          clearCompletedItems={this.clearCompletedItems}
          collection={this.props.collection}
          toggleAllItemsCompleted={this.toggleAllItemsCompleted} />
      </div>
    );
  }
})

React.renderComponent(
  <AppComponent collection={new TodoList()} />,
  document.getElementById("todoapp")
);
