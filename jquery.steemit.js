/**
 * jQuery Steemit Plugin
 * @author mkt <kontakt@markus-kottlaender.de>
 * @license MIT
 */

 (function ($) {

  $.fn.steemit = function() {
    var element = this;
    var steemit = {};

    // Profile
    steemit.profile = function(options) {
      var settings = $.extend({
        user: 'mkt',
        template: '<img width="100" src="${PROFILE_IMAGE}" /><br><a href="https://steemit.com/@${USER}">@${USER}</a>',
        reputationPrecision: 0,
        votingPowerPrecision: 2
      }, options);

      steem.api.getAccounts([settings.user], function(err, profile) {
        if (!err && profile.length) {
          var profile = profile[0];
          var metaData = JSON.parse(profile.json_metadata).profile;

          steem.api.getFollowCount(settings.user, function(err, followers) {
            var template = steemit.getTemplate(settings.template)
              .replace(/\${USER}/gi, profile.name)
              .replace(/\${NAME}/gi, metaData.name)
              .replace(/\${LOCATION}/gi, metaData.location)
              .replace(/\${WEBSITE}/gi, metaData.website)
              .replace(/\${IMAGE}/gi, metaData.profile_image)
              .replace(/\${REPUTATION}/gi, steemit.calculateReputation(profile.reputation, settings.reputationPrecision))
              .replace(/\${VOTINGPOWER}/gi, steemit.calculateVotingPower(profile.voting_power, profile.last_vote_time, settings.votingPowerPrecision))
              .replace(/\${FOLLOWERS}/gi, followers.follower_count)
              .replace(/\${FOLLOWING}/gi, followers.following_count)
              .replace(/\${POSTCOUNT}/gi, profile.post_count)
              .replace(/\${ABOUT}/gi, metaData.about);

            element.html(template);
          });
        }
      });
    };

    // Blog
    steemit.blog = function(options) {
      var settings = $.extend({
          user: "mkt",
          limit: 10,
          template: '<div><a href="${URL}">${TITLE}</a>${RESTEEMED}<br>${Payout}, ${UPVOTES} Upvotes, ${COMMENTS} Comments</div>',
          defaultImage: 'https://steemitimages.com/DQmXYX9hqSNcikTK8ARb61BPnTk4CKMhaiqr22iCKD8CKsp/steemit-logo.png',
          resteemedIndicator: ' (resteemed) ',
          payoutPrecision: 2,
          dateCallback: function (date) {
              return date;
          }
      }, options);

      steem.api.getDiscussionsByBlog({tag: settings.user, limit: settings.limit}, function(err, blog) {
          var html = '';
          for (var i = 0; i < blog.length; i++) {
            var metaData = JSON.parse(blog[i].json_metadata);
            var template = steemit.getTemplate(settings.template)
              .replace(/\${URL}/gi, 'https://steemit.com' + blog[i].url)
              .replace(/\${TITLE}/gi, blog[i].title)
              .replace(/\${AUTHOR}/gi, blog[i].author)
              .replace(/\${RESTEEMED}/gi, blog[i].author != settings.user ? settings.resteemedIndicator : '')
              .replace(/\${RESTEEMEDBY}/gi, blog[i].first_reblogged_by ? 'resteemed by ' + blog[i].first_reblogged_by : '')
              .replace(/\${DATE}/gi, settings.dateCallback(new Date(blog[i].created)))
              .replace(/\${IMAGE}/gi, metaData.image ? metaData.image[0] : settings.defaultImage)
              .replace(/\${PAYOUT}/gi, steemit.getPayout(blog[i]).toFixed(settings.payoutPrecision))
              .replace(/\${COMMENTS}/gi, blog[i].children)
              .replace(/\${UPVOTES}/gi, blog[i].net_votes)
              .replace(/\${CATEGORY}/gi, blog[i].category);

            html += template;
          }
          element.html(html);
        });
    };

    // Feed
    steemit.feed = function(options) {
      var settings = $.extend({
          user: "mkt",
          limit: 10,
          template: '<div><a href="${URL}">${TITLE}</a>${RESTEEMED}<br>${Payout}, ${UPVOTES} Upvotes, ${COMMENTS} Comments</div>',
          defaultImage: 'https://steemitimages.com/DQmXYX9hqSNcikTK8ARb61BPnTk4CKMhaiqr22iCKD8CKsp/steemit-logo.png',
          resteemedIndicator: ' (resteemed) ',
          payoutPrecision: 2,
          dateCallback: function (date) {
              return date;
          }
      }, options);

      steem.api.getDiscussionsByFeed({tag: settings.user, limit: settings.limit}, function(err, blog) {
        var html = '';
        for (var i = 0; i < blog.length; i++) {
          var metaData = JSON.parse(blog[i].json_metadata);
          var template = steemit.getTemplate(settings.template)
            .replace(/\${URL}/gi, 'https://steemit.com' + blog[i].url)
            .replace(/\${TITLE}/gi, blog[i].title)
            .replace(/\${AUTHOR}/gi, blog[i].author)
            .replace(/\${RESTEEMED}/gi, blog[i].first_reblogged_by ? settings.resteemedIndicator : '')
            .replace(/\${RESTEEMEDBY}/gi, blog[i].first_reblogged_by ? 'resteemed by ' + blog[i].first_reblogged_by : '')
            .replace(/\${DATE}/gi, settings.dateCallback(new Date(blog[i].created)))
            .replace(/\${IMAGE}/gi, metaData.image ? metaData.image[0] : settings.defaultImage)
            .replace(/\${PAYOUT}/gi, steemit.getPayout(blog[i]).toFixed(settings.payoutPrecision))
            .replace(/\${COMMENTS}/gi, blog[i].children)
            .replace(/\${UPVOTES}/gi, blog[i].net_votes)
            .replace(/\${CATEGORY}/gi, blog[i].category);

          html += template;
        }
        element.html(html);
      });
    };

    // New
    steemit.new = function(options) {
      var settings = $.extend({
          tag: null,
          limit: 10,
          template: '<div><a href="${URL}">${TITLE}</a><br>${Payout}, ${UPVOTES} Upvotes, ${COMMENTS} Comments</div>',
          defaultImage: 'https://steemitimages.com/DQmXYX9hqSNcikTK8ARb61BPnTk4CKMhaiqr22iCKD8CKsp/steemit-logo.png',
          payoutPrecision: 2,
          dateCallback: function (date) {
              return date;
          }
      }, options);

      steem.api.getDiscussionsByCreated({tag: settings.tag, limit: settings.limit}, function(err, blog) {
        var html = '';
        for (var i = 0; i < blog.length; i++) {
          var metaData = JSON.parse(blog[i].json_metadata);
          var template = steemit.getTemplate(settings.template)
            .replace(/\${URL}/gi, 'https://steemit.com' + blog[i].url)
            .replace(/\${TITLE}/gi, blog[i].title)
            .replace(/\${AUTHOR}/gi, blog[i].author)
            .replace(/\${DATE}/gi, settings.dateCallback(new Date(blog[i].created)))
            .replace(/\${IMAGE}/gi, metaData.image ? metaData.image[0] : settings.defaultImage)
            .replace(/\${PAYOUT}/gi, steemit.getPayout(blog[i]).toFixed(settings.payoutPrecision))
            .replace(/\${COMMENTS}/gi, blog[i].children)
            .replace(/\${UPVOTES}/gi, blog[i].net_votes)
            .replace(/\${CATEGORY}/gi, blog[i].category);

          html += template;
        }
        element.html(html);
      });
    };

    // Hot
    steemit.hot = function(options) {
      var settings = $.extend({
          tag: null,
          limit: 10,
          template: '<div><a href="${URL}">${TITLE}</a><br>${Payout}, ${UPVOTES} Upvotes, ${COMMENTS} Comments</div>',
          defaultImage: 'https://steemitimages.com/DQmXYX9hqSNcikTK8ARb61BPnTk4CKMhaiqr22iCKD8CKsp/steemit-logo.png',
          payoutPrecision: 2,
          dateCallback: function (date) {
              return date;
          }
      }, options);

      steem.api.getDiscussionsByHot({tag: settings.tag, limit: settings.limit}, function(err, blog) {
        var html = '';
        for (var i = 0; i < blog.length; i++) {
          var metaData = JSON.parse(blog[i].json_metadata);
          var template = steemit.getTemplate(settings.template)
            .replace(/\${URL}/gi, 'https://steemit.com' + blog[i].url)
            .replace(/\${TITLE}/gi, blog[i].title)
            .replace(/\${AUTHOR}/gi, blog[i].author)
            .replace(/\${DATE}/gi, settings.dateCallback(new Date(blog[i].created)))
            .replace(/\${IMAGE}/gi, metaData.image ? metaData.image[0] : settings.defaultImage)
            .replace(/\${PAYOUT}/gi, steemit.getPayout(blog[i]).toFixed(settings.payoutPrecision))
            .replace(/\${COMMENTS}/gi, blog[i].children)
            .replace(/\${UPVOTES}/gi, blog[i].net_votes)
            .replace(/\${CATEGORY}/gi, blog[i].category);

          html += template;
        }
        element.html(html);
      });
    };

    // New
    steemit.trending = function(options) {
      var settings = $.extend({
          tag: null,
          limit: 10,
          template: '<div><a href="${URL}">${TITLE}</a><br>${Payout}, ${UPVOTES} Upvotes, ${COMMENTS} Comments</div>',
          defaultImage: 'https://steemitimages.com/DQmXYX9hqSNcikTK8ARb61BPnTk4CKMhaiqr22iCKD8CKsp/steemit-logo.png',
          payoutPrecision: 2,
          dateCallback: function (date) {
              return date;
          }
      }, options);

      steem.api.getDiscussionsByTrending({tag: settings.tag, limit: settings.limit}, function(err, blog) {
        var html = '';
        for (var i = 0; i < blog.length; i++) {
          var metaData = JSON.parse(blog[i].json_metadata);
          var template = steemit.getTemplate(settings.template)
            .replace(/\${URL}/gi, 'https://steemit.com' + blog[i].url)
            .replace(/\${TITLE}/gi, blog[i].title)
            .replace(/\${AUTHOR}/gi, blog[i].author)
            .replace(/\${DATE}/gi, settings.dateCallback(new Date(blog[i].created)))
            .replace(/\${IMAGE}/gi, metaData.image ? metaData.image[0] : settings.defaultImage)
            .replace(/\${PAYOUT}/gi, steemit.getPayout(blog[i]).toFixed(settings.payoutPrecision))
            .replace(/\${COMMENTS}/gi, blog[i].children)
            .replace(/\${UPVOTES}/gi, blog[i].net_votes)
            .replace(/\${CATEGORY}/gi, blog[i].category);

          html += template;
        }
        element.html(html);
      });
    };

    /**
     * Helpers
     */

    steemit.getTemplate = function(template) {
      var templateElement = document.getElementById(template);
      if (templateElement) {
        return templateElement.innerHTML;
      }

      return template;
    }

    steemit.getPayout = function(post) {
      if (post.last_payout == '1970-01-01T00:00:00') {
        var payout = post.pending_payout_value.replace(' SBD', '');
        return parseFloat(payout);
      }

      var authorPayout = post.total_payout_value.replace(' SBD', '');
      var curatorPayout = post.curator_payout_value.replace(' SBD', '');

      return parseFloat(authorPayout) + parseFloat(curatorPayout);
    }

    steemit.calculateReputation = function(reputation, precision) {
      return ((((Math.log(reputation) / Math.LN10) - 9) * 9) + 25).toFixed(precision);
    }

    steemit.calculateVotingPower = function(votingPower, lastVoteTime, precision) {
      var secondsPassedSinceLastVote = (new Date - new Date(lastVoteTime + "Z")) / 1000;
      votingPower += (10000 * secondsPassedSinceLastVote / 432000);

      return Math.min(votingPower / 100, 100).toFixed(precision);
    }

    return steemit;
  };

 }(jQuery));
