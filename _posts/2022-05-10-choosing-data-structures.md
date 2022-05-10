---
layout: post
title: Choosing appropriate data structures
---

> "Show me your flowchart and conceal your tables, and I shall continue to be mystified. Show me your tables, and I won't usually need your flowchart; it'll be obvious." -- *Fred Brooks, The Mythical Man Month*

How do we choose which data structures to use in our code? In some instances it’s fairly obvious. When the amount of data we’re working with is the primary constraint, we probably need to choose the most efficient structure for what we’re trying to achieve.

However, often that isn’t the case. Often we’re working with small amounts of data, maybe tiny amounts of data. This data might even be small enough to be hardcoded. In these cases, efficiency isn’t a primary concern. Instead, clarity, simplicity, possibly maintainability are likely to be primary concerns. There might also be other guarantees we want which make certain structures more appropriate, guarantees around e.g. ordering, uniqueness or whether cyclic data is allowed. In other words, we want to make illegal states unrepresentable.

I’d like to argue that there is still good reason to choose efficient data structures, even when efficiency isn’t the primary concern. An efficient data structure isn’t just about efficiency: it communicates intent, and it is a base on which to build clear and simple algorithms. The APIs

Let’s consider an example. It’s not perfect but it’ll do.

For this blog, let’s say I want to add tags to each post. I don’t have many posts, and am unlikely to have many posts in the foreseeable future. The amount of data is so small we could hardcode this somewhere. There are several ways we could model this, including:

1. A list of posts: `List<Post>` where `Post = {id: PostId, tags: List<Tag>}`
2. A list of pairs of (post ID, tag): `List<[PostID, Tag]>`
3. A map from post ID to a list of tags: `Map<PostID, List<Tag>>`
4. A map from tag to a set of posts containing that tag: `Map<Tag, List<PostID>>`
5. Any of the above but with lists replaced with sets: e.g. `Set<Post>`

Which one should we choose? Well, before we decide we should ask ourselves the questions:

1. What are our use-cases?
2. What guarantees do we want from the data?

Let’s say we have two use-cases:

1. Given a post ID, find which tags it has. We can then display these on the post.
2. Given a tag, find which posts are associated with it. We can then click on a tag, and see other posts with the same tag.

As for guarantees, there are several we might be interested in, and some we aren’t.

1. Posts should not have duplicate tags. That is, each tag on a post should be unique. We wouldn’t want a list of tags to look like this `["data-structures", "data-structures"]`.
2. Conversely, when we click on a tag, we don’t to see associated posts appearing more than ones. Each post associated with a given tag should be unique.
3. Posts themselves should be unique. We don’t want to be able to represent the same post more than once with different associated tags.
4. We don’t care about the order of posts or tags.

Now we have what we need to make some decisions, let’s consider the original options:

1. `List<Post>`

    Not ideal. If we want to find the tags for a given post then we’d have to iterate through to find the post, then return the tags. If we wanted to find the posts associated with a tag then we’d need to iterate through the list, then for each post iterate through the tags and collect any post IDs which are associated with the tag. Faff. It doesn’t give us any of our guarantees, and the posts are ordered which we don’t care about.

    If I saw this data structure used, I would probably assume that the order is important in some way. I would be [surprised](https://en.wikipedia.org/wiki/Principle_of_least_astonishment) to find out that the only use of this structure was iterating through it to find specific, easily identifiable items.

2. `List<[PostID, Tag]>`

    Possibly even less suitable. To find the list of tags for a post, we’d need to iterate through the whole list, collecting tags as we go.

3. `Map<PostID, List<Tag>>`

    This is more like it. We can simply look up a list of tags given a post ID. Posts are unique here, we can’t have conflicting post/tag associations. It doesn’t help us look up post IDs from a given tag though. We'd need to treat it the same we do the list by iterating through the keys.

4. `Map<Tag, List<PostID>>`

    The same as above, but the other way around. Maybe we could use both, but it would be possible for them to get out of sync.

Unfortunately I don't know of any out-of-the-box data structures which give bidirectional many-to-many mappings. Bimaps are close, but they work for one-to-one relationships. We'd have to make do ourselves, and somehow manage the invariant that the two maps should represent the same data. If the data was readonly then we could simply create one map from the other and not have to worry about syncing issues.

So, we’ve decided that using maps is a good choice, but we still haven’t guaranteed all the properties we want. It is still possible to associate posts with duplicate tags, for example. This is where we can use sets instead of lists to give us uniqueness guarantees. Using two maps, and sets instead of lists, we might end up with our final data structure looking like this:

```tsx
{
  post_to_tags: Map<PostID, Set<Tag>>
  tag_to_posts: Map<Tag, Set<PostID>>
}
```

Is our final choice an efficient data structure? Yes! Both of the operations we want to perform are `O(1)`. Does this matter? Well, not really, but I don’t think it’s a coincidence. When a data structure is designed to be efficient for an operation, the API is also likely to be designed to be simple to use. Looking up a value in a map is generally simpler than iterating through to find a value in a list.

## Further reading

- [Hillel Wayne – Making Illegal States Unrepresentable](https://buttondown.email/hillelwayne/archive/making-illegal-states-unrepresentable/)
- [Alexis King – Parse, don’t validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/)
