const {gql}=require('apollo-server')
const typeDefs = gql`
  type User {
    username:String!
    favouriteGenre:String!
    id:ID!
  }
  type Token {
    value:String!
  }
  type Book{
    title:String!
    author:Author!
    published:Int!
    genres: [String!]!
    id: ID!
  }
  type Author{
    name:String!
    born:Int
    id: ID!
    bookCount:Int
  }
  type Query {
    bookCount:Int!
    authorCount: Int!
    allBooks(author:String, genre:String): [Book!]!
    allAuthors: [Author!]!
    me:User
  }
  type Mutation{
    addBook(
      title:String!
      author:String!
      published:Int!
      genres:[String!]!
    ):Book
    editAuthor(
      name:String!
      born:Int!
    ):Author
    createUser(
      username:String!
      favouriteGenre:String!
    ):User
    login(
      username:String!
      password:String!
    ):Token
  }
  type Subscription {
    bookAdded: Book!
  }    
`
module.exports=typeDefs