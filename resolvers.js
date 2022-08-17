const { UserInputError, AuthenticationError } = require('apollo-server')
const Book=require('./models/BookSchema')
const Author=require('./models/AuthorSchema')
const User=require('./models/UserSchema')
const jwt=require('jsonwebtoken')
const JWT_SECRET='NEED_HERE_A_SECRET_KEY'
const { PubSub } = require('graphql-subscriptions')
const pubsub = new PubSub()
const addAuthorFunction =async(name)=>{
    const object={name:name, bookCount:1}
    const newAuthor= new Author(object)
    console.log(`New author object: ${newAuthor}`)
    await newAuthor.save()
    return newAuthor
  }
  const updateAuthor= async(object)=>{
    const author=object
    object.bookCount+=1
    console.log(`Updated author:${author}`)
    await author.save()
    return author
  }
  const resolvers = {
    Query: {
      bookCount: async()=> Book.collection.countDocuments(),
      authorCount: async()=>Author.collection.countDocuments(), 
      allBooks: async(root,args)=>{
        if (args.genre){
          return await Book.find({genres:{$in:[args.genre]}}).populate('author')
        }
        return await Book.find({}).populate('author')
      },
      allAuthors: async()=> {
        return Author.find({})
      }, 
      me: (root, args, context) => {
        return context.currentUser
      }
    },
    Mutation:{
      addBook:async(root,args, context)=>{
        const currentUser=context.currentUser
        if (!currentUser){
          throw new AuthenticationError('not authenticated')
        }
        if (args.title.length<2 || args.author.length<4){
          throw new UserInputError(`Book title should be at least 2 characters. Authors' name should be at least 4 characters.`)
        }
        const newAuthor= await Author.findOne({name:args.author}).then(
          (result)=>{
            if(result){
              console.log(`Successfully found author:${result}`)
              return updateAuthor(result)
            }else{
              console.log('No document matches the provided query')
              return addAuthorFunction(args.author)
            }
          }
        ).catch(error=>new UserInputError(error.message), {
          invalidArgs:args
        })
        console.log(`Author added to the book ${newAuthor}`)
        const book= new Book({...args, author:newAuthor})
        console.log(`Added Book: ${book}`)
        try{
          await book.save()
        }catch(error){
          throw new UserInputError(error.message, {
            invalidArgs:args,
          })
        }
        pubsub.publish('BOOK_ADDED', {bookAdded:book})
        return book
      },
      editAuthor: async(root,args, context)=>{
        const currentUser=context.currentUser
        if (!currentUser){
          throw new AuthenticationError('not authenticated')
        }
        const author= await Author.findOne({name:args.name})
        author.born=args.born
        try{
          await author.save()
        }catch(error){
          throw new UserInputError(error.message, {
            invalidArgs:args,
          })
        }
        return author
      }, 
      createUser:async(root, args)=>{
        const user= new User({username:args.username, favouriteGenre:args.favouriteGenre})
        return user.save().catch(error=>new UserInputError(error.message), {
          invalidArgs:args
        })
      }, 
      login: async(root,args)=>{
        const user=await User.findOne({username:args.username})
        if (!user || args.password!=='secret'){
          throw new UserInputError('wrong credentials')
        }
        const userForToken={
          username:user.username,
          id:user._id
        }
        return {value:jwt.sign(userForToken, JWT_SECRET)}
      }
    },
    Subscription:{
        bookAdded:{
            subscribe:()=>pubsub.asyncIterator(['BOOK_ADDED'])
        }
    }
  }  
module.exports=resolvers